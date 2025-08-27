// Ad Configuration
// Replace with your actual Google AdSense Publisher ID after approval
export const AD_CONFIG = {
  // Get this from Google AdSense after approval
  ADSENSE_CLIENT_ID: 'ca-pub-YOUR_ADSENSE_ID', 
  
  // Ad slots for different placements (get these from AdSense)
  AD_SLOTS: {
    LOBBY_BANNER: '1234567890',     // Lobby page banner
    GAME_WAITING: '1234567891',     // While waiting for players
    RESULTS_BANNER: '1234567892',   // After game results
  },
  
  // Enable/disable ads (useful for development)
  ADS_ENABLED: false, // Set to true when you have real AdSense approval
};

// Instructions to get AdSense:
// 1. Apply at https://adsense.google.com
// 2. Add your website URL (your deployed Replit URL)
// 3. Wait for approval (can take a few days to weeks)
// 4. Once approved, replace the IDs above
// 5. Set ADS_ENABLED to true