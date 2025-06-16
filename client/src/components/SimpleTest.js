import React, { useState, useEffect } from 'react';

const SimpleTest = () => {
  const [logs, setLogs] = useState([]);
  const [counter, setCounter] = useState(0);

  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    console.log(logEntry);
    setLogs(prev => [...prev, logEntry]);
  };

  // This effect will run twice in StrictMode
  useEffect(() => {
    addLog(`Component mounted - Effect run #${counter + 1}`);
    setCounter(prev => prev + 1);
  }, []);

  const testFetch = async () => {
    addLog('Testing basic fetch...');
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5002/api'}/csrf-token`, {
        credentials: 'include'
      });
      if (response.ok) {
        addLog('✅ Fetch successful');
        const data = await response.json();
        addLog(`CSRF token: ${data.csrfToken.substring(0, 20)}...`);
      } else {
        addLog(`❌ Fetch failed: ${response.status}`);
      }
    } catch (error) {
      addLog(`❌ Fetch error: ${error.message}`);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Simple StrictMode Test</h1>
      <p>Effect run count: {counter}</p>
      <button onClick={testFetch} style={{ padding: '10px 20px', marginBottom: '20px' }}>
        Test Fetch
      </button>
      
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        border: '1px solid #dee2e6', 
        borderRadius: '5px', 
        padding: '15px',
        height: '300px',
        overflowY: 'auto'
      }}>
        {logs.map((log, index) => (
          <div key={index} style={{ fontFamily: 'monospace', fontSize: '12px', marginBottom: '5px' }}>
            {log}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SimpleTest;
