// ---- Edit these two lines, nothing else is required ----
window.CONFIG = {
  CHANNEL_ID: "3549308",      // ThingSpeak channel ID (a number, shown on your channel page)
  READ_API_KEY: "AM14PARR49WSXZWW",    // Channel > API Keys > Read API Key. Leave "" if the channel is Public.
                       // NEVER paste your WRITE key here.

  REFRESH_SECONDS: 20, // how often to ask ThingSpeak for new data
  HISTORY_POINTS: 60,  // how many past readings to chart
  STALE_MINUTES: 3,    // show "no new data" if the newest reading is older than this
  SHOW_PH: false,      // set true once a real pH sensor is connected

  MOIST_MIN: 40, MOIST_MAX: 80,
  TEMP_MIN: 15,  TEMP_MAX: 25
};
