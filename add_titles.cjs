const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'src/pages/client');

const titleMap = {
  'BannedPage.jsx': 'Tài khoản bị cấm',
  'ChatPage.jsx': 'Kênh chat',
  'FriendsPage.jsx': 'Bạn bè',
  'InvitePage.jsx': 'Lời mời',
  'ShopPage.jsx': 'Cửa hàng',
  'VoiceChannelPage.jsx': 'Kênh thoại'
};

for (const [file, title] of Object.entries(titleMap)) {
  const filePath = path.join(pagesDir, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Add import
    if (!content.includes("import { useTitle } from '../../hooks/useTitle';")) {
      // Find the last import
      const lastImportIndex = content.lastIndexOf('import ');
      const endOfLastImport = content.indexOf('\n', lastImportIndex);
      content = content.slice(0, endOfLastImport + 1) + "import { useTitle } from '../../hooks/useTitle';\n" + content.slice(endOfLastImport + 1);
    }
    
    // Add hook
    // We look for 'export default function ' and then the '{'
    const functionStart = content.indexOf('export default function ' + file.replace('.jsx', ''));
    if (functionStart !== -1) {
      const openBrace = content.indexOf('{', functionStart);
      if (openBrace !== -1) {
        content = content.slice(0, openBrace + 1) + `\n  useTitle('${title}');` + content.slice(openBrace + 1);
      }
    }
    
    fs.writeFileSync(filePath, content);
    console.log('Updated', file);
  }
}
