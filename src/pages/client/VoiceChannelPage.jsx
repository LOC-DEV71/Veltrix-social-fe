import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useOutletContext } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff, Headphones, HeadphoneOff, PhoneOff, Volume2, Sparkles, Signal, SignalHigh, Users, Video, VideoOff, Pin, MonitorUp, MonitorX, Maximize2, Minimize2 } from 'lucide-react';
import { useTitle } from '../../hooks/useTitle';

const DEFAULT_ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

export default function VoiceChannelPage() {
  useTitle('Kênh thoại');
  const { channelId, communityId } = useParams();
  const { selectedCommunity, communityChannels } = useOutletContext();
  const user = useSelector(state => state.auth?.user);
  const navigate = useNavigate();

  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [speaking, setSpeaking] = useState({}); // userId -> boolean
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // connecting, connected, disconnected
  const [remoteStreams, setRemoteStreams] = useState({}); // peerId -> MediaStream
  const [remoteStates, setRemoteStates] = useState({}); // userId -> { isMuted, isDeafened }
  const [pinnedUser, setPinnedUser] = useState(null); // userId string
  const [showPinnedList, setShowPinnedList] = useState(false);
  const [debugLogs, setDebugLogs] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenUserId, setFullscreenUserId] = useState(null); // which user is fullscreen'd
  const fullscreenContainerRef = useRef(null);

  const addDebug = (msg) => {
    console.log(msg);
    setDebugLogs(prev => [...prev.slice(-9), msg]);
  };

  const socketRef = useRef(null);
  const screenSocketRef = useRef(null);
  const localStreamRef = useRef(null);
  const localScreenStreamRef = useRef(null);
  const peersRef = useRef({}); // peerId -> { pc, audioEl }
  const screenPeersRef = useRef({}); // peerId -> { pc } for the screen pseudo-user
  const audioContextRef = useRef(null);
  const analyserRefs = useRef({}); // userId -> analyserNode
  const iceServersConfigRef = useRef(DEFAULT_ICE_SERVERS);

  // ======================== FULLSCREEN LOGIC ========================
  const toggleFullscreen = useCallback((userId) => {
    // Thử native Fullscreen API trước (Android/Desktop)
    const container = fullscreenContainerRef.current;
    const supportsFullscreen = !!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen);
    
    if (isFullscreen) {
      // Exit fullscreen
      if (document.fullscreenElement || document.webkitFullscreenElement) {
        const exit = document.exitFullscreen || document.webkitExitFullscreen;
        if (exit) exit.call(document);
      } else {
        // CSS pseudo-fullscreen exit (iOS)
        setIsFullscreen(false);
        setFullscreenUserId(null);
      }
    } else {
      setFullscreenUserId(userId);
      setIsFullscreen(true);
      if (supportsFullscreen && container) {
        const el = container.querySelector(`[data-fullscreen-id="${userId}"]`) || container;
        const req = el.requestFullscreen || el.webkitRequestFullscreen;
        if (req) req.call(el).catch(() => {
          // Nếu browser từ chối (iOS) → dùng CSS pseudo-fullscreen
        });
      }
      // iOS sẽ dùng CSS pseudo-fullscreen (isFullscreen + fullscreenUserId state)
    }
  }, [isFullscreen]);

  useEffect(() => {
    const onFsChange = () => {
      const isFull = !!(document.fullscreenElement || document.webkitFullscreenElement);
      if (!isFull) {
        setIsFullscreen(false);
        setFullscreenUserId(null);
      }
    };
    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      document.removeEventListener('webkitfullscreenchange', onFsChange);
    };
  }, []);
  // ==================================================================

  const currentChannel = communityChannels?.find(ch => ch._id === channelId);


  // Cleanup function
  const cleanup = useCallback(() => {
    // Stop local audio tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (localScreenStreamRef.current) {
      localScreenStreamRef.current.getTracks().forEach(track => track.stop());
      localScreenStreamRef.current = null;
    }

    // Close all peer connections
    Object.values(peersRef.current).forEach(({ pc }) => {
      pc.close();
    });
    peersRef.current = {};
    
    Object.values(screenPeersRef.current).forEach(pc => {
      pc.close();
    });
    screenPeersRef.current = {};
    
    setRemoteStreams({});

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Leave voice channel
    if (socketRef.current) {
      socketRef.current.emit('voice_leave', { channelId });
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    if (screenSocketRef.current) {
      screenSocketRef.current.emit('voice_leave', { channelId });
      screenSocketRef.current.disconnect();
      screenSocketRef.current = null;
    }

    setConnectionStatus('disconnected');
  }, [channelId]);

  // Initialize voice connection
  useEffect(() => {
    if (!user || !channelId) return;
    
    let isMounted = true;

    const socket = io(import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000', {
      auth: { token: localStorage.getItem('token') },
      transports: ['websocket', 'polling']
    });
    socketRef.current = socket;

    const initVoice = async () => {
      try {
        const token = localStorage.getItem('token');
        const apiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
        try {
          const res = await fetch(`${apiUrl}/api/webrtc/ice-servers`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const servers = await res.json();
            if (servers && servers.length > 0) {
              iceServersConfigRef.current = { iceServers: servers };
              addDebug('ICE servers fetched successfully.');
            }
          }
        } catch (error) {
          console.error("Could not fetch ICE servers", error);
        }

        addDebug('Requesting camera/mic permissions...');
        // Get user audio & video
        let stream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
            video: true // Request video initially but disable track
          });
        } catch (mediaErr) {
          addDebug(`Video failed, trying audio only...`);
          console.warn('Could not get video stream, falling back to audio only', mediaErr);
          stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            }
          });
        }
        
        addDebug('Media stream acquired successfully.');
        
        // Disable video track by default if it exists
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.enabled = false;
        }
        
        localStreamRef.current = stream;

        // Setup audio context for speaking detection
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioContextRef.current.createMediaStreamSource(stream);
        const analyser = audioContextRef.current.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.4;
        source.connect(analyser);

        // Check speaking state periodically
        const checkSpeaking = () => {
          if (!analyser) return;
          const data = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteFrequencyData(data);
          const avg = data.reduce((a, b) => a + b, 0) / data.length;
          const isSpeaking = avg > 15;
          setSpeaking(prev => {
            if (prev[(user._id || user.id)] !== isSpeaking) {
              return { ...prev, [(user._id || user.id)]: isSpeaking };
            }
            return prev;
          });
        };
        const speakingInterval = setInterval(checkSpeaking, 100);

        if (!isMounted) return;

        console.log('Voice socket state:', socket.connected ? 'already connected' : 'connecting...');

        const handleConnect = () => {
          if (!isMounted) return;
          console.log('Voice socket connected');
          setConnectionStatus('connected');
          addDebug('Socket connected, joined channel.');
          
          // Join voice channel
          socket.emit('voice_join', {
            channelId,
            communityId,
            user: {
              _id: (user._id || user.id),
              username: user.username,
              displayName: user.displayName,
              avatar: user.avatar,
              isPremium: user.isPremium,
            }
          });
          
          // Send initial state to others
          socket.emit('voice_state_update', { 
            channelId, 
            state: { isMuted, isDeafened, isVideoOn } 
          });
        };

        socket.on('connect', handleConnect);
        
        // ⚡ Nếu socket đã connect trước khi handler được đăng ký → gọi thủ công
        if (socket.connected) {
          handleConnect();
        }
        
        socket.on('connect_error', (err) => {
          if (!isMounted) return;
          addDebug(`Socket connect error: ${err.message}`);
          console.error('Voice socket connect_error:', err);
          setConnectionStatus('disconnected');
        });

        // When we get the list of existing users in the voice channel
        socket.on('voice_users', (users) => {
          addDebug(`Received existing users: ${users.length}`);
          setConnectedUsers(users);
          // Create peer connections to each existing user
          users.forEach(u => {
            if (u._id !== (user._id || user.id)) {
              addDebug(`Creating offer for ${u.username}`);
              createPeerConnection(u._id, true, localStreamRef.current, socket);
            }
          });
        });

        // When a new user joins
        socket.on('voice_user_joined', (newUser) => {
          addDebug(`New user joined: ${newUser.username}`);
          setConnectedUsers(prev => {
            if (prev.find(u => u._id === newUser._id)) return prev;
            return [...prev, newUser];
          });
          // Don't create offer - the new user will send offers to everyone
          
          // Reply with my current state to the new user implicitly by broadcasting again
          socket.emit('voice_state_update', { 
            channelId, 
            state: { isMuted, isDeafened, isVideoOn } 
          });
        });

        socket.on('voice_state_updated', ({ userId, state }) => {
          setRemoteStates(prev => ({
            ...prev,
            [userId]: { ...(prev[userId] || {}), ...state }
          }));
        });

        // When a user leaves
        socket.on('voice_user_left', (leftUserId) => {
          setConnectedUsers(prev => prev.filter(u => u._id !== leftUserId));
          // Close peer connection for that user
          if (peersRef.current[leftUserId]) {
            peersRef.current[leftUserId].pc.close();
            delete peersRef.current[leftUserId];
          }
          setRemoteStreams(prev => {
            const newStreams = { ...prev };
            delete newStreams[leftUserId];
            return newStreams;
          });
          setSpeaking(prev => {
            const n = { ...prev };
            delete n[leftUserId];
            return n;
          });
        });

        // WebRTC Signaling
        const iceCandidateQueues = {}; // peerId -> array of candidates

        socket.on('voice_offer', async ({ from, offer }) => {
          addDebug(`Received offer from ${from}`);
          
          let pc = peersRef.current[from]?.pc;
          if (!pc) {
            // ALWAYS use localStreamRef.current so we have the latest tracks
            pc = createPeerConnection(from, false, localStreamRef.current, socket);
          }
          
          try {
            const isPolite = (user._id || user.id) > from;
            if (pc.signalingState !== 'stable') {
              console.warn("Signaling state is not stable, glare detected");
              if (!isPolite) {
                addDebug(`Glare: I am impolite, ignoring offer from ${from}`);
                return;
              }
              addDebug(`Glare: I am polite, rolling back to accept offer from ${from}`);
              await pc.setLocalDescription({ type: "rollback" });
            }
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('voice_answer', { to: from, answer });
            addDebug(`Sent answer to ${from}`);
            
            // Process any queued ICE candidates
            if (iceCandidateQueues[from]) {
              for (const candidate of iceCandidateQueues[from]) {
                try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch(e){}
              }
              delete iceCandidateQueues[from];
            }
          } catch (error) {
            console.error("Error handling voice offer:", error);
          }
        });

        socket.on('voice_answer', async ({ from, answer }) => {
          addDebug(`Received answer from ${from}`);
          const peer = peersRef.current[from];
          if (peer) {
            await peer.pc.setRemoteDescription(new RTCSessionDescription(answer));
            // Process any queued ICE candidates
            if (iceCandidateQueues[from]) {
              for (const candidate of iceCandidateQueues[from]) {
                try { await peer.pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch(e){}
              }
              delete iceCandidateQueues[from];
            }
          }
        });

        socket.on('voice_ice_candidate', async ({ from, candidate }) => {
          const peer = peersRef.current[from];
          if (peer && peer.pc.remoteDescription) {
            try {
              await peer.pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
              console.error('Error adding ICE candidate:', e);
            }
          } else {
            if (!iceCandidateQueues[from]) iceCandidateQueues[from] = [];
            iceCandidateQueues[from].push(candidate);
          }
        });

        return () => {
          clearInterval(speakingInterval);
        };

      } catch (err) {
        console.error('Failed to get audio:', err);
        if (isMounted) {
          setConnectionStatus('disconnected');
        }
      }
    };

    initVoice();

    return () => {
      isMounted = false;
      cleanup();
    };
  }, [(user?._id || user?.id), channelId, communityId]);

  // Create a peer connection
  const createPeerConnection = (peerId, createOffer, stream, socket) => {
    // Don't create duplicate
    if (peersRef.current[peerId]) {
      return peersRef.current[peerId].pc;
    }

    const pc = new RTCPeerConnection(iceServersConfigRef.current);

    // Add local audio tracks
    if (stream) {
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });
    }

    // Handle incoming remote audio/video
    pc.ontrack = (event) => {
      setRemoteStreams(prev => {
        const tracks = pc.getReceivers().map(r => r.track).filter(Boolean);
        return {
          ...prev,
          [peerId]: new MediaStream(tracks)
        };
      });
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('voice_ice_candidate', {
          to: peerId,
          candidate: event.candidate
        });
      }
    };

    let negotiationPending = false;
    pc.onsignalingstatechange = () => {
      if (pc.signalingState === 'stable' && negotiationPending) {
        negotiationPending = false;
        pc.onnegotiationneeded();
      }
    };

    pc.onnegotiationneeded = async () => {
      if (pc.signalingState !== 'stable') {
        negotiationPending = true;
        return;
      }
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('voice_offer', { to: peerId, offer });
      } catch (err) {
        console.error("Negotiation error:", err);
      }
    };

    peersRef.current[peerId] = { pc };

    if (createOffer) {
      pc.createOffer().then(offer => {
        pc.setLocalDescription(offer);
        socket.emit('voice_offer', { to: peerId, offer });
      });
    }

    return pc;
  };

  // Toggle mute
  const toggleMute = () => {
    const newMuted = !isMuted;
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = newMuted ? false : true; 
      }
    }
    setIsMuted(newMuted);
    socketRef.current?.emit('voice_state_update', { channelId, state: { isMuted: newMuted } });
  };

  // Toggle video
  const toggleVideo = async () => {
    if (localStreamRef.current) {
      let videoTrack = localStreamRef.current.getVideoTracks()[0];
      
      if (videoTrack) {
        const newState = !isVideoOn;
        videoTrack.enabled = newState;
        setIsVideoOn(newState);
        socketRef.current?.emit('voice_state_update', { channelId, state: { isVideoOn: newState } });
      } else {
        // Dynamically request video if not present
        try {
          addDebug('Requesting dynamic video...');
          const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
          const newVideoTrack = videoStream.getVideoTracks()[0];
          
          // Recreate local stream to force local UI to update its srcObject
          const currentTracks = localStreamRef.current.getTracks();
          const newStream = new MediaStream([...currentTracks, newVideoTrack]);
          localStreamRef.current = newStream;
          
          // Add to all peer connections
          Object.values(peersRef.current).forEach(({ pc }) => {
            try {
              const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
              if (sender) {
                sender.replaceTrack(newVideoTrack);
              } else {
                pc.addTrack(newVideoTrack, localStreamRef.current);
              }
            } catch(e) { console.error(e) }
          });
          setIsVideoOn(true);
          socketRef.current?.emit('voice_state_update', { channelId, state: { isVideoOn: true } });
          addDebug('Camera activated.');
        } catch (err) {
          addDebug('Camera request failed.');
          alert('Không tìm thấy camera hoặc bị từ chối quyền truy cập!');
        }
      }
    }
  };

  // Toggle Screen Share
  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        addDebug('Requesting screen share...');
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
        const screenTrack = screenStream.getVideoTracks()[0];
        
        localScreenStreamRef.current = screenStream;
        
        const pseudoUser = {
          ...user,
          _id: `${(user._id || user.id)}_screen`,
          username: `${user.username} (Screen)`,
          displayName: `${user.displayName || user.username} (Screen)`,
          isScreen: true,
          isPremium: false
        };

        const screenSocket = io(import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000', {
          auth: { token: localStorage.getItem('token') }
        });
        screenSocketRef.current = screenSocket;

        const screenIceCandidateQueues = {}; // peerId -> array of candidates

        // Bare minimum WebRTC signaling for the sender (our screen to everyone else)
        screenSocket.on('voice_users', (users) => {
          users.forEach(u => {
            if (u._id !== (user._id || user.id) && u._id !== pseudoUser._id) {
              const pc = new RTCPeerConnection(iceServersConfigRef.current);
              screenStream.getTracks().forEach(t => pc.addTrack(t, screenStream));
              
              pc.onicecandidate = e => {
                if (e.candidate) screenSocket.emit('voice_ice_candidate', { to: u._id, candidate: e.candidate });
              };
              
              pc.createOffer().then(offer => {
                pc.setLocalDescription(offer);
                screenSocket.emit('voice_offer', { to: u._id, offer });
              });
              
              screenPeersRef.current[u._id] = pc;
            }
          });
        });

        screenSocket.on('voice_answer', async ({ from, answer }) => {
          const pc = screenPeersRef.current[from];
          if (pc) {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
            if (screenIceCandidateQueues[from]) {
              for (const candidate of screenIceCandidateQueues[from]) {
                try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch(e){}
              }
              delete screenIceCandidateQueues[from];
            }
          }
        });

        screenSocket.on('voice_ice_candidate', async ({ from, candidate }) => {
          const pc = screenPeersRef.current[from];
          if (pc && pc.remoteDescription) {
             try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch(e){}
          } else {
             if (!screenIceCandidateQueues[from]) screenIceCandidateQueues[from] = [];
             screenIceCandidateQueues[from].push(candidate);
          }
        });

        screenSocket.on('voice_offer', async ({ from, offer }) => {
          // If a new user joins later, they will send an offer to the pseudo-user
          const pc = new RTCPeerConnection(iceServersConfigRef.current);
          screenStream.getTracks().forEach(t => pc.addTrack(t, screenStream));
          
          pc.onicecandidate = e => {
            if (e.candidate) screenSocket.emit('voice_ice_candidate', { to: from, candidate: e.candidate });
          };
          
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          screenSocket.emit('voice_answer', { to: from, answer });
          
          screenPeersRef.current[from] = pc;
        });

        // Finally, join the channel
        screenSocket.emit('voice_join', {
          channelId,
          communityId,
          user: pseudoUser
        });

        // Tell everyone this is just screen share so they don't expect audio
        screenSocket.emit('voice_state_update', { 
          channelId, 
          state: { isMuted: true, isDeafened: true, isScreenSharing: true } 
        });

        // Handle stop sharing via browser UI
        screenTrack.onended = () => {
          setIsScreenSharing(false);
          if (localScreenStreamRef.current) {
            localScreenStreamRef.current.getTracks().forEach(t => t.stop());
            localScreenStreamRef.current = null;
          }
          if (screenSocketRef.current) {
            screenSocketRef.current.emit('voice_leave', { channelId });
            screenSocketRef.current.disconnect();
            screenSocketRef.current = null;
          }
          Object.values(screenPeersRef.current).forEach(pc => pc.close());
          screenPeersRef.current = {};
        };
        
        setIsScreenSharing(true);
        addDebug('Screen share started.');
      } catch (err) {
        addDebug('Screen share cancelled/failed.');
      }
    } else {
      // Stop sharing
      if (localScreenStreamRef.current) {
        localScreenStreamRef.current.getTracks().forEach(t => t.stop());
        localScreenStreamRef.current = null;
      }
      if (screenSocketRef.current) {
        screenSocketRef.current.emit('voice_leave', { channelId });
        screenSocketRef.current.disconnect();
        screenSocketRef.current = null;
      }
      Object.values(screenPeersRef.current).forEach(pc => pc.close());
      screenPeersRef.current = {};
      
      setIsScreenSharing(false);
      addDebug('Screen share stopped.');
    }
  };

  // Toggle deafen
  const toggleDeafen = () => {
    const newDeafened = !isDeafened;
    setIsDeafened(newDeafened);
    socketRef.current?.emit('voice_state_update', { channelId, state: { isDeafened: newDeafened } });

    // Also mute self when deafened
    if (newDeafened && !isMuted) {
      toggleMute();
    } else if (!newDeafened && isMuted) {
      // Actually, don't auto-unmute when undeafened, but we can do it for convenience or let the user do it.
      toggleMute();
    }
  };

  // Disconnect
  const handleDisconnect = () => {
    cleanup();
    navigate(`/community/${communityId}/channel/${communityChannels?.find(ch => ch.type === 'text')?._id || ''}`);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#000000] h-full relative">

      {/* ===== FULLSCREEN OVERLAY (Portal → render thẳng vào document.body, bypass mọi z-index) ===== */}
      {isFullscreen && fullscreenUserId && createPortal((() => {
        const u = connectedUsers.find(u => u._id === fullscreenUserId);
        if (!u) return null;
        const isMe = u._id === user?._id;
        const isMyScreen = u._id === `${user?._id}_screen`;
        const userStream = isMe ? localStreamRef.current 
                         : isMyScreen ? localScreenStreamRef.current 
                         : remoteStreams[u._id];
        const hasVideo = (isMe && isVideoOn) || (isMyScreen && isScreenSharing) || u.isScreen || remoteStates[u._id]?.isVideoOn;
        const avatar = u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.displayName || u.username || 'U')}&background=5865f2&color=fff`;

        return (
          <div 
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 2147483647, // Max z-index possible
              backgroundColor: '#000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {hasVideo ? (
              <video
                autoPlay playsInline
                muted={isMe || isDeafened}
                ref={video => {
                  if (video && video.srcObject !== userStream) {
                    video.srcObject = userStream;
                    video.play().catch(() => {});
                  }
                }}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            ) : (
              <img src={avatar} alt={u.username} style={{ width: 160, height: 160, borderRadius: '50%', objectFit: 'cover' }} />
            )}

            {/* Tên người dùng */}
            <div style={{
              position: 'absolute', bottom: 112, left: 20,
              background: 'rgba(0,0,0,0.65)', padding: '8px 14px',
              borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8
            }}>
              <span style={{ color: u.isPremium ? '#f47fff' : '#fff', fontWeight: 600, fontSize: 16 }}>
                {u.displayName || u.username}
              </span>
            </div>

            {/* Nút thoát fullscreen */}
            <button
              onClick={() => toggleFullscreen(fullscreenUserId)}
              style={{
                position: 'absolute', top: 20, right: 20,
                width: 48, height: 48, borderRadius: '50%',
                background: 'rgba(0,0,0,0.75)', border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,0.5)'
              }}
            >
              <Minimize2 style={{ width: 24, height: 24, color: '#fff' }} />
            </button>
          </div>
        );
      })(), document.body)}


      {/* Header */}
      <div className="h-12 border-b border-[#1f2023] bg-[#313338] flex items-center px-4 shrink-0 z-10">
        <Volume2 className="w-5 h-5 text-[#80848e] mr-2" />
        <span className="text-white font-semibold text-[15px]">{currentChannel?.name || 'Kênh thoại'}</span>
      </div>

      {/* Voice Channel Content */}
      <div className="flex-1 flex flex-col p-4 overflow-hidden relative">
        
        {/* Connection Status Indicator */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-full text-xs font-medium shadow-lg backdrop-blur-sm transition-all duration-300">
          {connectionStatus === 'connecting' && (
            <>
              <Signal className="w-4 h-4 text-amber-500 animate-pulse" />
              <span className="text-amber-500">Đang kết nối...</span>
            </>
          )}
          {connectionStatus === 'connected' && (
            <>
              <SignalHigh className="w-4 h-4 text-emerald-500" />
              <span className="text-emerald-500">Đã kết nối</span>
            </>
          )}
          {connectionStatus === 'disconnected' && (
            <>
              <Signal className="w-4 h-4 text-rose-500 opacity-50" />
              <span className="text-rose-500">Đã ngắt kết nối</span>
            </>
          )}
        </div>

        {/* Connected Users Grid */}
        <div 
          ref={fullscreenContainerRef}
          className={`w-full h-full flex flex-wrap items-center justify-center gap-4 relative ${pinnedUser ? 'bg-black' : ''} ${isFullscreen ? 'bg-black' : ''}`}
        >
          
          {/* Unpinned View (Normal Grid) */}
          {!pinnedUser && connectedUsers.map(u => {
            const isSpeaking = speaking[u._id];
            const avatar = u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.displayName || u.username || 'U')}&background=5865f2&color=fff`;
            const isMe = u._id === user?._id;
            const isMyScreen = u._id === `${user?._id}_screen`;
            
            const userStream = isMe ? localStreamRef.current 
                             : isMyScreen ? localScreenStreamRef.current 
                             : remoteStreams[u._id];
                             
            const hasVideo = (isMe && isVideoOn) || 
                             (isMyScreen && isScreenSharing) || 
                             u.isScreen || 
                             remoteStates[u._id]?.isVideoOn;

            return (
              <div 
                key={u._id} 
                data-fullscreen-id={u._id}
                onDoubleClick={() => toggleFullscreen(u._id)}
                className={`relative rounded-xl overflow-hidden bg-[#1e1f22] flex items-center justify-center transition-all group ${
                  isSpeaking ? 'ring-[3px] ring-emerald-500' : 'ring-2 ring-transparent'
                } flex-1 basis-[300px] max-w-[800px] max-h-full aspect-video cursor-pointer`}
              >
                
                {hasVideo ? (
                  <video
                    autoPlay
                    playsInline
                    muted={isMe || isDeafened}
                    ref={video => {
                      if (video && video.srcObject !== userStream) {
                        video.srcObject = userStream;
                        video.play().catch(e => console.error("Video play error:", e));
                      }
                    }}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <>
                    <div className="relative w-20 h-20 md:w-28 md:h-28">
                      <img
                        src={avatar}
                        alt={u.username}
                        className="w-full h-full object-cover rounded-full"
                      />
                    </div>
                    {/* Audio element for remote users without video */}
                    {!isMe && userStream && (
                      <audio
                        autoPlay
                        playsInline
                        muted={isDeafened}
                        ref={audio => {
                          if (audio && audio.srcObject !== userStream) {
                            audio.srcObject = userStream;
                            audio.play().catch(e => console.error("Audio play error:", e));
                          }
                        }}
                      />
                    )}
                  </>
                )}

                {/* Username Pill */}
                <div className="absolute bottom-3 left-3 bg-black/60 px-2 py-1 rounded-md flex items-center gap-1.5 z-10">
                  <span className={`text-sm font-medium ${u.isPremium ? 'text-[#f47fff]' : 'text-white'}`}>
                    {u.displayName || u.username}
                  </span>
                  {u.isPremium && <Sparkles className="w-3.5 h-3.5 text-[#f47fff]" />}
                </div>

                {/* Status Indicators Pill (Hide for screen share) */}
                {!(isMyScreen || u.isScreen) && (
                  <div className="absolute bottom-3 right-3 flex gap-1 z-10 bg-black/60 px-1 py-1 rounded-md">
                    {(isMe ? isMuted : remoteStates[u._id]?.isMuted) && (
                      <div className="w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center">
                        <MicOff className="w-3 h-3 text-white" />
                      </div>
                    )}
                    {(isMe ? isDeafened : remoteStates[u._id]?.isDeafened) && (
                      <div className="w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center">
                        <HeadphoneOff className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                )}
                
                {/* Top-right action buttons — always visible on mobile, hover on desktop */}
                <div className="absolute top-2 right-2 flex gap-1.5 z-20 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  {/* Fullscreen Button */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleFullscreen(u._id); }}
                    className="w-9 h-9 bg-black/70 hover:bg-black/90 rounded-full flex items-center justify-center shadow-lg"
                    title="Xem toàn màn hình"
                  >
                    <Maximize2 className="w-4 h-4 text-white" />
                  </button>
                  {/* Pin Button */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); setPinnedUser(u._id); }}
                    className="w-9 h-9 bg-black/70 hover:bg-black/90 rounded-full flex items-center justify-center shadow-lg"
                    title="Ghim video"
                  >
                    <Pin className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Pinned User View - Full Screen Layout */}
          {pinnedUser && (
            <>
              {/* The Pinned User */}
              {(() => {
                const u = connectedUsers.find(u => u._id === pinnedUser);
                if (!u) {
                  setPinnedUser(null);
                  return null;
                }
                const isSpeaking = speaking[u._id];
                const avatar = u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.displayName || u.username || 'U')}&background=5865f2&color=fff`;
                const isMe = u._id === user?._id;
                const isMyScreen = u._id === `${user?._id}_screen`;
                
                const userStream = isMe ? localStreamRef.current 
                                 : isMyScreen ? localScreenStreamRef.current 
                                 : remoteStreams[u._id];
                
                const hasVideo = (isMe && isVideoOn) || 
                                 (isMyScreen && isScreenSharing) || 
                                 u.isScreen || 
                                 remoteStates[u._id]?.isVideoOn;

                return (
                  <div className="absolute inset-0 flex items-center justify-center transition-all h-full group bg-black">
                    <div className={`absolute inset-0 border-4 pointer-events-none z-20 ${isSpeaking ? 'border-emerald-500' : 'border-transparent'} transition-colors duration-200`}></div>
                    
                    {hasVideo ? (
                      <video
                        autoPlay
                        playsInline
                        muted={isMe || isDeafened}
                        ref={video => {
                          if (video && video.srcObject !== userStream) {
                            video.srcObject = userStream;
                            video.play().catch(e => console.error("Video play error:", e));
                          }
                        }}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="relative w-48 h-48 md:w-64 md:h-64">
                        <img
                          src={avatar}
                          alt={u.username}
                          className="w-full h-full object-cover rounded-full shadow-2xl"
                        />
                        {/* Ensure audio is played when pinned user has no video */}
                        {!isMe && userStream && (
                          <audio
                            autoPlay
                            playsInline
                            muted={isDeafened}
                            ref={audio => {
                              if (audio && audio.srcObject !== userStream) {
                                audio.srcObject = userStream;
                                audio.play().catch(e => console.error("Audio play error:", e));
                              }
                            }}
                          />
                        )}
                      </div>
                    )}

                    <div className="absolute bottom-6 left-6 flex items-center gap-2 z-30">
                      <div className="bg-black/60 px-4 py-2 rounded-md flex items-center gap-2 shadow-lg">
                        <span className={`text-lg font-medium ${u.isPremium ? 'text-[#f47fff]' : 'text-white'}`}>
                          {u.displayName || u.username}
                        </span>
                        {u.isPremium && <Sparkles className="w-5 h-5 text-[#f47fff]" />}
                      </div>
                    </div>

                    {/* Top-right action buttons for pinned view */}
                    <div className="absolute top-6 right-6 z-30 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* Fullscreen toggle */}
                      <button 
                        onClick={() => toggleFullscreen(u._id)}
                        className="w-12 h-12 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center shadow-lg"
                        title={isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}
                      >
                        {isFullscreen ? <Minimize2 className="w-6 h-6 text-white" /> : <Maximize2 className="w-6 h-6 text-white" />}
                      </button>
                      {/* Unpin button */}
                      <button 
                        onClick={() => setPinnedUser(null)}
                        className="w-12 h-12 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center shadow-lg"
                        title="Bỏ ghim"
                      >
                        <Pin className="w-6 h-6 text-white" />
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Floating Bottom-Right Container for Other Users */}
              {(() => {
                const others = connectedUsers.filter(u => u._id !== pinnedUser);
                if (others.length === 0) return null;

                const firstOther = others[0];
                const avatar = firstOther.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(firstOther.displayName || firstOther.username || 'U')}&background=5865f2&color=fff`;
                const isMe = firstOther._id === user?._id;
                const isMyScreen = firstOther._id === `${user?._id}_screen`;
                
                const userStream = isMe ? localStreamRef.current 
                                 : isMyScreen ? localScreenStreamRef.current 
                                 : remoteStreams[firstOther._id];
                                 
                const hasVideo = (isMe && isVideoOn) || 
                                 (isMyScreen && isScreenSharing) || 
                                 firstOther.isScreen || 
                                 remoteStates[firstOther._id]?.isVideoOn;
                const isSpeaking = speaking[firstOther._id];

                return (
                  <div className="absolute bottom-24 right-6 z-40 flex flex-col items-end">
                    
                    {/* List Dropdown Menu */}
                    {showPinnedList && (
                      <div className="mb-3 w-64 bg-[#2b2d31] rounded-xl shadow-2xl border border-[#1f2023] p-2 flex flex-col gap-1 max-h-72 overflow-y-auto">
                        <div className="text-xs font-semibold text-[#b5bac1] uppercase px-2 py-1 mb-1">
                          Thành viên ({connectedUsers.length})
                        </div>
                        {connectedUsers.map(u => (
                          <div 
                            key={u._id}
                            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                              u._id === pinnedUser ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' : 'text-[#dbdee1] hover:bg-[#3f4147]'
                            }`}
                            onClick={() => {
                              setPinnedUser(u._id === pinnedUser ? null : u._id);
                              setShowPinnedList(false);
                            }}
                          >
                            <img src={u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.displayName || u.username || 'U')}&background=5865f2&color=fff`} className="w-8 h-8 rounded-full" />
                            <span className="text-sm font-medium flex-1 truncate">{u.displayName || u.username}</span>
                            {u._id === pinnedUser && <Pin className="w-4 h-4 shrink-0" />}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Small Floating Tile */}
                    <div 
                      className={`relative w-48 aspect-video bg-[#1e1f22] rounded-xl cursor-pointer shadow-xl overflow-hidden transition-all hover:scale-105 group ${
                        isSpeaking ? 'ring-2 ring-emerald-500' : 'ring-1 ring-[#1f2023]'
                      }`}
                      onClick={() => setShowPinnedList(!showPinnedList)}
                    >
                      {hasVideo ? (
                        <video
                          autoPlay
                          playsInline
                          muted={true}
                          ref={video => {
                            if (video && video.srcObject !== userStream) {
                              video.srcObject = userStream;
                              video.play().catch(e => console.error(e));
                            }
                          }}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <img
                            src={avatar}
                            className="w-12 h-12 object-cover rounded-full"
                          />
                        </div>
                      )}

                      {/* +N Overlay if more than 1 other user */}
                      {others.length > 1 && (
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center backdrop-blur-[1px]">
                          <span className="text-white text-2xl font-bold">+{others.length - 1}</span>
                          <span className="text-white/80 text-xs mt-1">Xem danh sách</span>
                        </div>
                      )}

                      {!showPinnedList && others.length === 1 && (
                        <>
                          <div className="absolute bottom-1.5 left-1.5 bg-black/60 px-1.5 py-0.5 rounded flex items-center gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[10px] font-medium text-white max-w-[80px] truncate">
                              {firstOther.displayName || firstOther.username}
                            </span>
                          </div>

                          <div className="absolute bottom-1.5 right-1.5 flex gap-0.5 z-10 bg-black/60 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                            {(isMe ? isMuted : remoteStates[firstOther._id]?.isMuted) && (
                              <div className="w-4 h-4 bg-rose-500 rounded-full flex items-center justify-center">
                                <MicOff className="w-2.5 h-2.5 text-white" />
                              </div>
                            )}
                            {(isMe ? isDeafened : remoteStates[firstOther._id]?.isDeafened) && (
                              <div className="w-4 h-4 bg-rose-500 rounded-full flex items-center justify-center">
                                <HeadphoneOff className="w-2.5 h-2.5 text-white" />
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                    
                    {/* Hidden Audio Elements for all other users to ensure we can still hear them */}
                    <div className="hidden">
                      {others.map(otherUser => {
                        const otherIsMe = otherUser._id === user?._id;
                        if (otherIsMe) return null; // don't play our own audio
                        const otherStream = remoteStreams[otherUser._id];
                        if (!otherStream) return null;
                        
                        return (
                          <audio
                            key={`hidden-audio-${otherUser._id}`}
                            autoPlay
                            playsInline
                            muted={isDeafened}
                            ref={audio => {
                              if (audio && audio.srcObject !== otherStream) {
                                audio.srcObject = otherStream;
                                audio.play().catch(e => console.error(e));
                              }
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </>
          )}

          {/* Hidden audio elements for non-pinned users when pinned (to ensure we still hear them) */}
          {pinnedUser && (
            <div className="hidden">
              {connectedUsers.map(u => {
                if (u._id === pinnedUser || u._id === user?._id) return null;
                const userStream = remoteStreams[u._id];
                if (!userStream) return null;
                return (
                  <audio
                    key={`audio-${u._id}`}
                    autoPlay
                    playsInline
                    muted={isDeafened}
                    ref={audio => {
                      if (audio && audio.srcObject !== userStream) {
                        audio.srcObject = userStream;
                        audio.play().catch(e => console.error("Hidden audio play error:", e));
                      }
                    }}
                  />
                );
              })}
            </div>
          )}

        </div>

        {connectedUsers.length === 0 && connectionStatus === 'connected' && (
          <div className="text-[#949ba4] text-sm mt-4">
            Chưa có ai trong kênh thoại
          </div>
        )}

      </div>

      {/* Controls Bar */}
      <div className="h-20 bg-[#1e1f22] border-t border-[#1f2023] flex items-center justify-center gap-4 shrink-0 px-4 pb-2 pt-2 z-10">
        
        {/* Video Button */}
        <button
          onClick={toggleVideo}
          disabled={isScreenSharing}
          className={`w-[52px] h-[52px] rounded-full flex items-center justify-center transition-all ${
            isVideoOn
              ? 'bg-white text-[#111214] hover:bg-gray-200'
              : 'bg-[#2b2d31] text-[#dbdee1] hover:bg-[#3f4147]'
          } ${isScreenSharing ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={isVideoOn ? 'Tắt camera' : 'Bật camera'}
        >
          {isVideoOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
        </button>

        {/* Screen Share Button */}
        <button
          onClick={toggleScreenShare}
          className={`w-[52px] h-[52px] rounded-full flex items-center justify-center transition-all ${
            isScreenSharing
              ? 'bg-emerald-500 text-white hover:bg-emerald-600'
              : 'bg-[#2b2d31] text-[#dbdee1] hover:bg-[#3f4147]'
          }`}
          title={isScreenSharing ? 'Dừng chia sẻ' : 'Chia sẻ màn hình'}
        >
          {isScreenSharing ? <MonitorX className="w-6 h-6" /> : <MonitorUp className="w-6 h-6" />}
        </button>

        {/* Mute Button */}
        <button
          onClick={toggleMute}
          className={`w-[52px] h-[52px] rounded-full flex items-center justify-center transition-all ${
            isMuted
              ? 'bg-[#da373c] text-white hover:bg-[#a1282c]'
              : 'bg-[#2b2d31] text-[#dbdee1] hover:bg-[#3f4147]'
          }`}
          title={isMuted ? 'Bật mic' : 'Tắt mic'}
        >
          {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>

        {/* Deafen Button */}
        <button
          onClick={toggleDeafen}
          className={`w-[52px] h-[52px] rounded-full flex items-center justify-center transition-all ${
            isDeafened
              ? 'bg-[#da373c] text-white hover:bg-[#a1282c]'
              : 'bg-[#2b2d31] text-[#dbdee1] hover:bg-[#3f4147]'
          }`}
          title={isDeafened ? 'Bật âm thanh' : 'Tắt âm thanh'}
        >
          {isDeafened ? <HeadphoneOff className="w-6 h-6" /> : <Headphones className="w-6 h-6" />}
        </button>

        {/* Disconnect Button */}
        <button
          onClick={handleDisconnect}
          className="w-[72px] h-[52px] bg-[#da373c] hover:bg-[#a1282c] text-white rounded-3xl flex items-center justify-center transition-all shadow-md ml-4"
          title="Ngắt kết nối"
        >
          <PhoneOff className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
