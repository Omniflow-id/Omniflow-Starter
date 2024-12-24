const getClientIP = (req) => {
    // Get IP from various headers and sources
    const rawIP = (req.headers['x-forwarded-for'] || '').split(',').pop().trim() ||
      req.headers['x-real-ip'] ||
      req.headers['x-client-ip'] ||
      req.ip ||
      req.connection.remoteAddress ||
      '0.0.0.0';
  
    // If it's an IPv6 format for localhost, convert to IPv4
    if (rawIP === '::1') return '127.0.0.1';
    
    // If it's an IPv6 with embedded IPv4, extract the IPv4 part
    if (rawIP.includes('::ffff:')) {
      return rawIP.split('::ffff:')[1];
    }
    
    // If it's a pure IPv6, return a default IPv4
    if (rawIP.includes(':')) {
      return '0.0.0.0';
    }
    
    return rawIP;
  };
  
  module.exports = { getClientIP };