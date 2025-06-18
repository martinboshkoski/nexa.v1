// Simple verification script for social post data
// Run this in the browser console on the social feed page to see the data structure

console.log('🔍 Social Post Data Verification Script');
console.log('---------------------------------------');

// Helper function to get random placeholder logo
function getPlaceholderLogoUrl(companyName = 'TC') {
  const colors = ['4F46E5', '10B981', 'F59E0B', 'EF4444', '8B5CF6'];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  const letter = companyName.charAt(0).toUpperCase();
  return `https://via.placeholder.com/80x80/${randomColor}/FFFFFF?text=${letter}`;
}

// Function to check what data is available for social posts
function checkSocialPostData() {
  // Try to find the social feed container
  const socialFeedElement = document.querySelector('[class*="SocialFeed"]');
  
  if (!socialFeedElement) {
    console.log('❌ Social feed not found on this page');
    return;
  }
  
  console.log('✅ Social feed found');
  
  // Check if there are any post cards
  const postCards = document.querySelectorAll('[class*="postCard"]');
  console.log(`📊 Found ${postCards.length} post cards`);
  
  // Check company sections
  const companySections = document.querySelectorAll('[class*="companySection"]');
  console.log(`🏢 Found ${companySections.length} company sections`);
  
  companySections.forEach((section, index) => {
    console.log(`\n📋 Company Section ${index + 1}:`);
    
    const companyName = section.querySelector('[class*="companyName"]');
    const companyAddress = section.querySelector('[class*="companyAddress"]');
    const companyEmail = section.querySelector('[class*="companyEmail"]');
    const companyWebsite = section.querySelector('[class*="companyWebsite"]');
    const companyTaxNumber = section.querySelector('[class*="companyTaxNumber"]');
    
    console.log('  - Company Name:', companyName?.textContent || 'Not found');
    console.log('  - Address:', companyAddress?.textContent || 'Not found');
    console.log('  - Email:', companyEmail?.textContent || 'Not found');
    console.log('  - Website:', companyWebsite?.textContent || 'Not found');
    console.log('  - Tax Number:', companyTaxNumber?.textContent || 'Not found');
  });
}

// Also provide a function to manually check the React component state
function checkReactData() {
  console.log('\n🔍 To check React component data:');
  console.log('1. Open React DevTools');
  console.log('2. Find the SocialFeed component');
  console.log('3. Look at the "posts" state');
  console.log('4. Expand a post and check post.author.companyInfo');
}

// Run the checks
checkSocialPostData();
checkReactData();

// Function to inject a test social post with company logo
function injectTestSocialPost() {
  console.log('\n🧪 Injecting test social post with company logo...');
  
  // Test company data
  const testCompany = {
    companyName: 'GVRL',
    address: 'ул. Никола Парапунов бр. 5, Скопје - Карпош',
    contactEmail: 'gvrl@gvrl.mk',
    website: 'https://gvrl.mk',
    industry: 'Правни услуги',
    mission: 'Правни услуги за сите граѓани',
    logoUrl: getPlaceholderLogoUrl('GVRL')
  };

  console.log('📋 Test company data:', testCompany);
  console.log('🖼️ Logo URL:', testCompany.logoUrl);
  
  // Find any existing posts to use as templates
  const postsList = document.querySelector('[class*="postsList"]');
  const firstPost = postsList?.firstElementChild;
  
  if (!postsList || !firstPost) {
    console.error('❌ Could not find posts list or template post');
    return;
  }
  
  console.log('✅ Found posts list element');
  
  // Create a new test post element
  const testPost = document.createElement('div');
  testPost.className = firstPost.className;
  testPost.style.border = '2px dashed #4F46E5';
  testPost.style.position = 'relative';
  
  // Add a "TEST" label to identify it
  const testLabel = document.createElement('div');
  testLabel.textContent = 'TEST POST';
  testLabel.style.position = 'absolute';
  testLabel.style.top = '0';
  testLabel.style.right = '0';
  testLabel.style.background = '#4F46E5';
  testLabel.style.color = 'white';
  testLabel.style.padding = '4px 8px';
  testLabel.style.fontSize = '12px';
  testLabel.style.fontWeight = 'bold';
  testLabel.style.borderRadius = '0 0 0 4px';
  testPost.appendChild(testLabel);
  
  // Create the structure based on the SocialFeed component
  testPost.innerHTML = `
    <div class="${firstPost.querySelector('[class*="companySection"]')?.className || ''}">
      <div class="${firstPost.querySelector('[class*="companyDetails"]')?.className || ''}">
        <div class="${firstPost.querySelector('[class*="companyLogoContainer"]')?.className || ''}">
          <img src="${testCompany.logoUrl}" 
               alt="${testCompany.companyName} logo" 
               class="${firstPost.querySelector('[class*="companyLogo"]')?.className || ''}"
               onerror="this.style.display='none';this.parentNode.innerHTML='<div class=\\'${firstPost.querySelector('[class*="companyLogoPlaceholder"]')?.className || ''}\\'>G</div>'">
        </div>
        <div class="${firstPost.querySelector('[class*="companyName"]')?.className || ''}">${testCompany.companyName}</div>
        <div class="${firstPost.querySelector('[class*="companyAddress"]')?.className || ''}">📍 ${testCompany.address}</div>
        <a href="${testCompany.website}" target="_blank" rel="noopener noreferrer" 
           class="${firstPost.querySelector('[class*="companyWebsite"]')?.className || ''}">🌐 ${testCompany.website}</a>
        <a href="mailto:${testCompany.contactEmail}" 
           class="${firstPost.querySelector('[class*="companyEmail"]')?.className || ''}">✉️ ${testCompany.contactEmail}</a>
        <div class="${firstPost.querySelector('[class*="companyMission"]')?.className || ''}">💼 ${testCompany.mission}</div>
      </div>
    </div>
    <div class="${firstPost.querySelector('[class*="postMainContent"]')?.className || ''}">
      <div class="${firstPost.querySelector('[class*="postHeader"]')?.className || ''}">
        <div class="${firstPost.querySelector('[class*="authorInfo"]')?.className || ''}">
          <div class="${firstPost.querySelector('[class*="authorAvatarPlaceholder"]')?.className || ''}">T</div>
          <div>
            <div class="${firstPost.querySelector('[class*="authorName"]')?.className || ''}">Test User</div>
            <div class="${firstPost.querySelector('[class*="postTime"]')?.className || ''}">пред 1м</div>
          </div>
        </div>
      </div>
      <div class="${firstPost.querySelector('[class*="postContent"]')?.className || ''}">
        <p>This is a test post to verify company logo display. This post was injected via the verification script.</p>
      </div>
    </div>
  `;
  
  // Insert at the beginning of the posts list
  postsList.insertBefore(testPost, postsList.firstChild);
  
  console.log('✅ Test post successfully injected!');
  console.log('🔎 Check the top of the feed for the test post with logo');
}

console.log('\n💡 To inject a test post with logo, run: injectTestSocialPost()');

console.log('\n✅ Verification script completed!');
console.log('💡 Tip: Look for console logs starting with "🔍 Social Post Debug" to see the actual data structure');
