const fs = require('fs');
const path = 'src/components/UserSettingsModal.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add states
const stateAddition = `
  const [bannerColor, setBannerColor] = useState(user?.bannerColor || '#85744a');
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(user?.bannerImage || null);
`;
content = content.replace(/const \[bannerColor, setBannerColor\] = useState[^;]+;/g, stateAddition.trim());

// 2. Add effect update
const effectAddition = `
      setBannerColor(user.bannerColor || '#85744a');
      setBannerPreview(user.bannerImage || null);
      setBannerFile(null);
`;
content = content.replace(/setBannerColor\(user\.bannerColor[^;]+;/g, effectAddition.trim());

// 3. Update handleSaveProfile
const saveAddition = `
      formData.append('bannerColor', bannerColor);
      if (bannerFile) formData.append('bannerFile', bannerFile);
      if (bannerPreview === null && user.bannerImage) formData.append('removeBanner', 'true');
`;
content = content.replace(/formData\.append\('bannerColor', bannerColor\);/g, saveAddition.trim());

// 4. Add handlers
const handlersAddition = `
  const handleBannerClick = () => {
    document.getElementById('banner-upload')?.click();
  };

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

  const handleRemoveBanner = () => {
    setBannerFile(null);
    setBannerPreview(null);
    setHasChanges(true);
  };

  const handleAvatarClick = () => {
`;
content = content.replace(/const handleAvatarClick = \(\) => {/g, handlersAddition.trim());

// 5. Update Preview divs
// We replace the style={{ backgroundColor: bannerColor }} with bannerPreview if exists
const oldDiv1 = '<div className="h-[100px] w-full" style={{ backgroundColor: bannerColor }} />';
const newDiv1 = `
                      {bannerPreview ? (
                        <div className="h-[100px] w-full bg-cover bg-center" style={{ backgroundImage: \`url(\${bannerPreview})\` }} />
                      ) : (
                        <div className="h-[100px] w-full" style={{ backgroundColor: bannerColor }} />
                      )}
`;
// Replace all occurrences (Server Profile preview and Profile preview)
content = content.split(oldDiv1).join(newDiv1.trim());

// 6. Update buttons
const oldButtons = `
                          <button className="bg-[#5865F2] hover:bg-[#4752C4] text-white px-4 py-2 rounded text-[13px] font-semibold transition-colors">Thay Biểu Ngữ</button>
                          <button className="text-[#dbdee1] px-4 py-2 rounded text-[13px] font-semibold transition-colors bg-[#2b2d31] hover:bg-[#35373c]">Xóa Biểu Ngữ</button>
`;
const newButtons = `
                          <input type="file" id="banner-upload" accept="image/*" className="hidden" onChange={handleBannerChange} />
                          <button onClick={handleBannerClick} className="bg-[#5865F2] hover:bg-[#4752C4] text-white px-4 py-2 rounded text-[13px] font-semibold transition-colors">Thay Biểu Ngữ</button>
                          <button onClick={handleRemoveBanner} className="text-[#dbdee1] px-4 py-2 rounded text-[13px] font-semibold transition-colors bg-[#2b2d31] hover:bg-[#35373c]">Xóa Biểu Ngữ</button>
`;
content = content.split(oldButtons.trim()).join(newButtons.trim());

// 7. Also update the account tab banner preview to use bannerImage
const oldAccountBanner = `<div className={\`h-24 w-full \${user.isPremium ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500' : 'bg-[#5865F2]'}\`}></div>`;
const newAccountBanner = `
              {bannerPreview ? (
                <div className="h-24 w-full bg-cover bg-center" style={{ backgroundImage: \`url(\${bannerPreview})\` }}></div>
              ) : (
                <div className={\`h-24 w-full \${user.isPremium ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500' : 'bg-[#5865F2]'}\`} style={{ backgroundColor: bannerColor }}></div>
              )}
`;
content = content.replace(oldAccountBanner, newAccountBanner.trim());

fs.writeFileSync(path, content);
console.log('Frontend updated.');
