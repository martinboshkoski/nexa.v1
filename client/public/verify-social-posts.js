// Simple verification script for social post data
// Run this in the browser console on the social feed page to see the data structure

console.log('🔍 Social Post Data Verification Script');
console.log('---------------------------------------');

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

console.log('\n✅ Verification script completed!');
console.log('💡 Tip: Look for console logs starting with "🔍 Social Post Debug" to see the actual data structure');
