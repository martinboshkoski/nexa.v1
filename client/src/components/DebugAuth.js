import React, { useState, useEffect } from 'react';

const DebugAuth = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '' });

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, message, type }]);
    console.log(`[${timestamp}] ${message}`);
  };

  const testFetch = async () => {
    setLoading(true);
    addLog('Starting fetch test...', 'info');
    
    try {
      addLog('About to fetch CSRF token...', 'info');
      
      const csrfResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5002/api'}/csrf-token`, {
        credentials: 'include',
      });
      
      addLog(`CSRF response status: ${csrfResponse.status}`, 'info');
      
      if (!csrfResponse.ok) {
        throw new Error(`CSRF fetch failed: ${csrfResponse.status}`);
      }
      
      const csrfData = await csrfResponse.json();
      addLog(`CSRF token received (first 20 chars): ${csrfData.csrfToken.substring(0, 20)}...`, 'info');
      
      // Test registration
      const testData = {
        username: `testuser_${Date.now()}`,
        password: 'testpassword123'
      };
      
      addLog(`Testing registration with username: ${testData.username}`, 'info');
      
      const registerResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5002/api'}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfData.csrfToken,
        },
        body: JSON.stringify(testData),
        credentials: 'include',
      });
      
      addLog(`Registration response status: ${registerResponse.status}`, 'info');
      
      const registerResult = await registerResponse.text();
      addLog(`Registration result: ${registerResult}`, registerResponse.ok ? 'info' : 'error');
      
      if (registerResponse.ok) {
        addLog('✅ All tests passed!', 'success');
      } else {
        addLog('❌ Registration failed', 'error');
      }
      
    } catch (error) {
      addLog(`❌ Error: ${error.message}`, 'error');
      addLog(`Error stack: ${error.stack}`, 'debug');
    } finally {
      setLoading(false);
    }
  };

  const testOriginalAuthContext = async () => {
    setLoading(true);
    addLog('Testing original AuthContext functions...', 'info');
    
    try {
      // Simulate the exact same flow as AuthContext.registerSimple
      addLog('Fetching CSRF token (AuthContext style)...', 'info');
      
      const csrfResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5002/api'}/csrf-token`, {
        credentials: 'include',
      });
      
      if (!csrfResponse.ok) {
        throw new Error('Failed to fetch CSRF token');
      }
      
      const csrfData = await csrfResponse.json();
      const csrfToken = csrfData.csrfToken;
      
      addLog(`CSRF token obtained: ${csrfToken.substring(0, 20)}...`, 'info');

      const username = `authtest_${Date.now()}`;
      const password = 'testpass123';
      
      addLog(`Attempting registration with username: ${username}`, 'info');

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5002/api'}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({ username, password }),
        credentials: 'include',
      });

      const data = await response.json();
      
      addLog(`Response status: ${response.status}`, 'info');
      addLog(`Response data: ${JSON.stringify(data)}`, 'info');
      
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      addLog('✅ AuthContext simulation successful!', 'success');
      
    } catch (error) {
      addLog(`❌ AuthContext simulation failed: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const testFormSubmission = async (e) => {
    e.preventDefault();
    setLoading(true);
    addLog('=== FORM SUBMISSION TEST ===', 'info');
    addLog(`Username: ${formData.username}`, 'info');
    addLog(`Password: ${formData.password ? '[HIDDEN]' : '[EMPTY]'}`, 'info');
    
    try {
      // Exact same flow as AuthContext.registerSimple
      addLog('Step 1: Fetching CSRF token...', 'info');
      
      const csrfResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5002/api'}/csrf-token`, {
        credentials: 'include',
      });
      
      if (!csrfResponse.ok) {
        throw new Error('Failed to fetch CSRF token');
      }
      
      const csrfData = await csrfResponse.json();
      const csrfToken = csrfData.csrfToken;
      
      addLog(`CSRF token: ${csrfToken.substring(0, 20)}...`, 'info');
      addLog('Step 2: Submitting registration...', 'info');

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5002/api'}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({ 
          username: formData.username, 
          password: formData.password 
        }),
        credentials: 'include',
      });

      const data = await response.json();
      
      addLog(`Response status: ${response.status}`, 'info');
      addLog(`Response data: ${JSON.stringify(data, null, 2)}`, 'info');
      
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      addLog('✅ Form submission successful!', 'success');
      
    } catch (error) {
      addLog(`❌ Form submission failed: ${error.message}`, 'error');
      addLog(`Error name: ${error.name}`, 'debug');
      addLog(`Error stack: ${error.stack}`, 'debug');
    } finally {
      setLoading(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  useEffect(() => {
    addLog('DebugAuth component mounted', 'info');
    addLog(`Current URL: ${window.location.href}`, 'info');
    addLog(`User agent: ${navigator.userAgent}`, 'debug');
    
    // Test if fetch is available
    if (typeof fetch === 'function') {
      addLog('✅ fetch function is available', 'info');
    } else {
      addLog('❌ fetch function is NOT available', 'error');
    }
    
    // Test basic fetch
    addLog('Testing basic fetch to same origin...', 'info');
    fetch(window.location.origin)
      .then(response => {
        addLog(`✅ Basic fetch successful: ${response.status}`, 'info');
      })
      .catch(error => {
        addLog(`❌ Basic fetch failed: ${error.message}`, 'error');
      });
      
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Auth Debug Component</h1>
      
      {/* Form Test Section */}
      <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <h2>Form Submission Test</h2>
        <form onSubmit={testFormSubmission}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Username:</label>
            <input 
              type="text" 
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              style={{ padding: '8px', width: '200px', border: '1px solid #ccc', borderRadius: '3px' }}
              placeholder="Enter username"
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Password:</label>
            <input 
              type="password" 
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              style={{ padding: '8px', width: '200px', border: '1px solid #ccc', borderRadius: '3px' }}
              placeholder="Enter password"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            style={{ padding: '10px 20px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px' }}
          >
            {loading ? 'Submitting...' : 'Test Form Submit'}
          </button>
        </form>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={testFetch} 
          disabled={loading}
          style={{ marginRight: '10px', padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px' }}
        >
          {loading ? 'Testing...' : 'Test Basic Fetch'}
        </button>
        
        <button 
          onClick={testOriginalAuthContext} 
          disabled={loading}
          style={{ marginRight: '10px', padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px' }}
        >
          {loading ? 'Testing...' : 'Test AuthContext Flow'}
        </button>
        
        <button 
          onClick={clearLogs}
          style={{ padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '5px' }}
        >
          Clear Logs
        </button>
      </div>
      
      <div style={{ 
        backgroundColor: '#1a1a1a', 
        color: '#00ff00', 
        padding: '15px', 
        borderRadius: '5px', 
        fontFamily: 'Courier New, monospace', 
        fontSize: '12px',
        height: '400px',
        overflowY: 'auto',
        whiteSpace: 'pre-wrap'
      }}>
        {logs.map((log, index) => (
          <div 
            key={index} 
            style={{ 
              color: log.type === 'error' ? '#ff4444' : 
                     log.type === 'success' ? '#44ff44' : 
                     log.type === 'debug' ? '#888888' : '#00ff00' 
            }}
          >
            [{log.timestamp}] {log.message}
          </div>
        ))}
        {logs.length === 0 && 'Waiting for logs...'}
      </div>
    </div>
  );
};

export default DebugAuth;
