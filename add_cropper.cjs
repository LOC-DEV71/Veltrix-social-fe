const fs = require('fs');
const path = 'src/components/UserSettingsModal.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add import
if (!content.includes('ImageCropperModal')) {
  content = content.replace(
    /import React(.*?);\n/,
    `import React$1;\nimport ImageCropperModal from './ImageCropperModal';\n`
  );
}

// 2. Add states
const stateAddition = `
  const [bannerPreview, setBannerPreview] = useState(user?.bannerImage || null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);
`;
content = content.replace(/const \[bannerPreview, setBannerPreview\] = useState[^;]+;/g, stateAddition.trim());

// 3. Update handleBannerChange & add handleCropComplete
const oldHandleBannerChange = `
  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type === 'image/gif' && !user?.isPremium) {
      showNotification('Hãy nâng cấp Premium để sử dụng biểu ngữ động (GIF)!', 'error');
      e.target.value = '';
      return;
    }
    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
    setHasChanges(true);
  };
`;
const newHandleBannerChange = `
  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type === 'image/gif' && !user?.isPremium) {
      showNotification('Hãy nâng cấp Premium để sử dụng biểu ngữ động (GIF)!', 'error');
      e.target.value = '';
      return;
    }
    
    if (file.type !== 'image/gif') {
      const reader = new FileReader();
      reader.onload = () => {
        setImageToCrop(reader.result);
        setIsCropperOpen(true);
      };
      reader.readAsDataURL(file);
    } else {
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
      setHasChanges(true);
    }
    e.target.value = '';
  };

  const handleCropComplete = (croppedFile, croppedUrl) => {
    setBannerFile(croppedFile);
    setBannerPreview(croppedUrl);
    setHasChanges(true);
  };
`;
content = content.replace(oldHandleBannerChange.trim(), newHandleBannerChange.trim());

// 4. Render ImageCropperModal
const modalJSX = `
      <ImageCropperModal
        isOpen={isCropperOpen}
        imageSrc={imageToCrop}
        onClose={() => { setIsCropperOpen(false); setImageToCrop(null); }}
        onCropComplete={handleCropComplete}
        aspectRatio={17 / 6}
        title="Điều Chỉnh Kích Thước Biểu Ngữ"
      />
    </div>
  );
}
`;
// Replace the very end of the file
content = content.replace(/    <\/div>\n  \);\n}\n?$/g, modalJSX);

fs.writeFileSync(path, content);
console.log('UserSettingsModal updated with cropper');
