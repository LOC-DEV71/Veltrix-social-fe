const fs = require('fs');

const files = [
  'src/components/MemberProfilePopout.jsx',
  'src/components/UserProfileModal.jsx',
  'src/components/ChatArea.jsx',
  'src/components/Sidebar.jsx'
];

for(let file of files) {
  if(!fs.existsSync(file)) continue;
  let text = fs.readFileSync(file, 'utf8');
  
  // Replace style={{ backgroundColor: user.bannerColor }}
  // with background image logic. Since variable names might differ (user, member, targetUser),
  // we do a generic replacement if it finds a bannerColor reference in a div.
  
  text = text.replace(/<div className="([^"]*h-\[60px\][^"]*|[^"]*h-\[120px\][^"]*|[^"]*h-\[100px\][^"]*|[^"]*h-24[^"]*)" style={{ backgroundColor: (.*?) }}\s*\/>/g, 
    (match, p1, p2) => {
      // p2 is the expression for bannerColor, e.g., user.bannerColor, member?.user?.bannerColor
      const bannerImgExpr = p2.replace('bannerColor', 'bannerImage');
      return \`{\${bannerImgExpr} ? (
        <div className="\${p1} bg-cover bg-center" style={{ backgroundImage: \\\`url(\\\${\${bannerImgExpr}})\\\` }} />
      ) : (
        <div className="\${p1}" style={{ backgroundColor: \${p2} }} />
      )}\`;
    }
  );
  
  // same but for <div ...></div>
  text = text.replace(/<div className="([^"]*h-\[60px\][^"]*|[^"]*h-\[120px\][^"]*|[^"]*h-\[100px\][^"]*|[^"]*h-24[^"]*)" style={{ backgroundColor: (.*?) }}><\/div>/g, 
    (match, p1, p2) => {
      const bannerImgExpr = p2.replace('bannerColor', 'bannerImage');
      return \`{\${bannerImgExpr} ? (
        <div className="\${p1} bg-cover bg-center" style={{ backgroundImage: \\\`url(\\\${\${bannerImgExpr}})\\\` }}></div>
      ) : (
        <div className="\${p1}" style={{ backgroundColor: \${p2} }}></div>
      )}\`;
    }
  );

  fs.writeFileSync(file, text);
}
console.log('Popouts updated successfully.');
