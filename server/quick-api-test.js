const axios = require('axios');

async function quickTest() {
  try {
    console.log('Testing post creation API...');
    
    // Test with a simple curl-like request
    const response = await axios.post('http://localhost:5002/api/social/posts', {
      content: 'Test post for immediate display',
      postType: 'user_post'
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      validateStatus: function (status) {
        return status < 500; // Don't throw for 4xx errors
      }
    });
    
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    if (response.status === 401) {
      console.log('✅ Good - requires authentication as expected');
    } else if (response.status === 201) {
      console.log('✅ Post created successfully!');
      console.log('Post has author populated:', !!response.data.post?.author);
    } else {
      console.log('Response status:', response.status);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

quickTest();
