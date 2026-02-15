/**
 * HealthPulse - Storage Module
 * Handles all data persistence using IndexedDB (structured data)
 * and localStorage (simple preferences).
 * Privacy-first: all data remains on-device, never transmitted.
 */
window.HealthStorage = (function () {
  'use strict';

  /** Database configuration constants */
  var DB_NAME = 'healthpulse_db';
  var DB_VERSION = 1;
  var STORE_CHECKINS = 'checkins';
  var STORE_METRICS = 'metrics';
  var PREF_PREFIX = 'hp_';

  /** Database connection reference */
  var db = null;

  /**
   * Initialize the IndexedDB database.
   * Creates object stores and indexes if they do not exist.
   * @returns {Promise<IDBDatabase>} Resolved database instance
   */
  function init() {
    return new Promise(function (resolve, reject) {
      if (db) {
        resolve(db);
        return;
      }
      var request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = function (event) {
        var database = event.target.result;
        if (!database.objectStoreNames.contains(STORE_CHECKINS)) {
          var checkinStore = database.createObjectStore(STORE_CHECKINS, {
            keyPath: 'id',
            autoIncrement: true
          });
          checkinStore.createIndex('date', 'date', { unique: true });
          checkinStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        if (!database.objectStoreNames.contains(STORE_METRICS)) {
          var metricStore = database.createObjectStore(STORE_METRICS, {
            keyPath: 'id',
            autoIncrement: true
          });
          metricStore.createIndex('date', 'date', { unique: true });
          metricStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };

      request.onsuccess = function (event) {
        db = event.target.result;
        resolve(db);
      };

      request.onerror = function (event) {
        reject(event.target.error);
      };
    });
  }

  /**
   * Get today's date formatted as YYYY-MM-DD.
   * @returns {string} Date string
   */
  function todayStr() {
    var d = new Date();
    var year = d.getFullYear();
    var month = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
  }

  /**
   * Insert or update a record in a store, keyed by date.
   * If a record with the same date exists, it is updated.
   * @param {string} storeName - IndexedDB object store name
   * @param {Object} data - Record data (must include a 'date' field)
   * @returns {Promise<number>} Record ID
   */
  function upsertByDate(storeName, data) {
    return new Promise(function (resolve, reject) {
      var tx = db.transaction(storeName, 'readwrite');
      var store = tx.objectStore(storeName);
      var dateIndex = store.index('date');
      var getReq = dateIndex.get(data.date);

      getReq.onsuccess = function () {
        var existing = getReq.result;
        if (existing) {
          data.id = existing.id;
        }
        var putReq = store.put(data);
        putReq.onsuccess = function () {
          resolve(putReq.result);
        };
        putReq.onerror = function () {
          reject(putReq.error);
        };
      };

      getReq.onerror = function () {
        reject(getReq.error);
      };
    });
  }

  /**
   * Save a daily check-in entry.
   * Fields: mood, physical, sleep, nutrition, stress (1-5), symptoms (text).
   * @param {Object} entry - Check-in data
   * @returns {Promise<number>} Saved record ID
   */
  function saveCheckIn(entry) {
    entry.date = entry.date || todayStr();
    entry.timestamp = Date.now();
    return upsertByDate(STORE_CHECKINS, entry);
  }

  /**
   * Save daily health metrics.
   * Fields: weight (kg), sleepHours, workoutMinutes.
   * @param {Object} entry - Metric data
   * @returns {Promise<number>} Saved record ID
   */
  function saveMetric(entry) {
    entry.date = entry.date || todayStr();
    entry.timestamp = Date.now();
    return upsertByDate(STORE_METRICS, entry);
  }

  /**
   * Retrieve all records from a store, optionally limited to the last N days.
   * Results are sorted by date ascending.
   * @param {string} storeName - Object store name
   * @param {number} [days] - Number of recent days to include
   * @returns {Promise<Array>} Array of records
   */
  function getAll(storeName, days) {
    return new Promise(function (resolve, reject) {
      var tx = db.transaction(storeName, 'readonly');
      var store = tx.objectStore(storeName);
      var results = [];
      var cutoff = null;

      if (days) {
        var d = new Date();
        d.setDate(d.getDate() - days);
        var year = d.getFullYear();
        var month = String(d.getMonth() + 1).padStart(2, '0');
        var day = String(d.getDate()).padStart(2, '0');
        cutoff = year + '-' + month + '-' + day;
      }

      var request = store.openCursor();
      request.onsuccess = function (event) {
        var cursor = event.target.result;
        if (cursor) {
          if (!cutoff || cursor.value.date >= cutoff) {
            results.push(cursor.value);
          }
          cursor.continue();
        } else {
          results.sort(function (a, b) {
            return a.date.localeCompare(b.date);
          });
          resolve(results);
        }
      };

      request.onerror = function () {
        reject(request.error);
      };
    });
  }

  /**
   * Get all check-in records, optionally for the last N days.
   * @param {number} [days] - Number of recent days
   * @returns {Promise<Array>} Check-in records
   */
  function getCheckIns(days) {
    return getAll(STORE_CHECKINS, days);
  }

  /**
   * Get all metric records, optionally for the last N days.
   * @param {number} [days] - Number of recent days
   * @returns {Promise<Array>} Metric records
   */
  function getMetrics(days) {
    return getAll(STORE_METRICS, days);
  }

  /**
   * Get today's check-in record, or null if not completed.
   * @returns {Promise<Object|null>} Today's check-in or null
   */
  function getTodayCheckIn() {
    return new Promise(function (resolve, reject) {
      var tx = db.transaction(STORE_CHECKINS, 'readonly');
      var store = tx.objectStore(STORE_CHECKINS);
      var index = store.index('date');
      var request = index.get(todayStr());

      request.onsuccess = function () {
        resolve(request.result || null);
      };
      request.onerror = function () {
        reject(request.error);
      };
    });
  }

  /**
   * Get today's metric record, or null if not entered.
   * @returns {Promise<Object|null>} Today's metrics or null
   */
  function getTodayMetric() {
    return new Promise(function (resolve, reject) {
      var tx = db.transaction(STORE_METRICS, 'readonly');
      var store = tx.objectStore(STORE_METRICS);
      var index = store.index('date');
      var request = index.get(todayStr());

      request.onsuccess = function () {
        resolve(request.result || null);
      };
      request.onerror = function () {
        reject(request.error);
      };
    });
  }

  /**
   * Calculate the current streak of consecutive daily check-ins.
   * Counts backward from today, stopping at the first missing day.
   * @returns {Promise<number>} Number of consecutive days
   */
  function getStreak() {
    return getCheckIns().then(function (entries) {
      if (entries.length === 0) return 0;
      var streak = 0;
      var today = new Date();
      today.setHours(0, 0, 0, 0);
      var dateSet = {};
      entries.forEach(function (e) {
        dateSet[e.date] = true;
      });
      for (var i = 0; i <= 365; i++) {
        var checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - i);
        var year = checkDate.getFullYear();
        var month = String(checkDate.getMonth() + 1).padStart(2, '0');
        var day = String(checkDate.getDate()).padStart(2, '0');
        var dateStr = year + '-' + month + '-' + day;
        if (dateSet[dateStr]) {
          streak++;
        } else {
          break;
        }
      }
      return streak;
    });
  }

  /**
   * Get the total number of check-in records.
   * @returns {Promise<number>} Total count
   */
  function getCheckInCount() {
    return new Promise(function (resolve, reject) {
      var tx = db.transaction(STORE_CHECKINS, 'readonly');
      var store = tx.objectStore(STORE_CHECKINS);
      var countReq = store.count();
      countReq.onsuccess = function () {
        resolve(countReq.result);
      };
      countReq.onerror = function () {
        reject(countReq.error);
      };
    });
  }

  /**
   * Get a stored preference from localStorage.
   * @param {string} key - Preference key
   * @param {*} [defaultVal] - Default value if not found
   * @returns {*} Stored or default value
   */
  function getPref(key, defaultVal) {
    try {
      var val = localStorage.getItem(PREF_PREFIX + key);
      return val !== null ? JSON.parse(val) : (defaultVal !== undefined ? defaultVal : null);
    } catch (e) {
      return defaultVal !== undefined ? defaultVal : null;
    }
  }

  /**
   * Store a preference in localStorage.
   * @param {string} key - Preference key
   * @param {*} value - Value to store (JSON-serializable)
   */
  function setPref(key, value) {
    localStorage.setItem(PREF_PREFIX + key, JSON.stringify(value));
  }

  /**
   * Export all app data as a JSON object for backup.
   * @returns {Promise<Object>} Complete data export
   */
  function exportAll() {
    return Promise.all([getCheckIns(), getMetrics()]).then(function (results) {
      return {
        appName: 'HealthPulse',
        exportDate: new Date().toISOString(),
        checkins: results[0],
        metrics: results[1],
        preferences: {
          language: getPref('language', 'en'),
          reminders: getPref('reminders', false),
          reminderTime: getPref('reminderTime', '09:00')
        }
      };
    });
  }

  /**
   * Clear all stored data. Preserves the language preference.
   * @returns {Promise<void>}
   */
  function clearAll() {
    return new Promise(function (resolve, reject) {
      var tx = db.transaction([STORE_CHECKINS, STORE_METRICS], 'readwrite');
      tx.objectStore(STORE_CHECKINS).clear();
      tx.objectStore(STORE_METRICS).clear();

      tx.oncomplete = function () {
        var lang = getPref('language', 'en');
        var keys = [];
        for (var i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i);
          if (k && k.indexOf(PREF_PREFIX) === 0) {
            keys.push(k);
          }
        }
        keys.forEach(function (k) {
          localStorage.removeItem(k);
        });
        setPref('language', lang);
        resolve();
      };

      tx.onerror = function () {
        reject(tx.error);
      };
    });
  }

  /** Public API */
  return {
    init: init,
    saveCheckIn: saveCheckIn,
    saveMetric: saveMetric,
    getCheckIns: getCheckIns,
    getMetrics: getMetrics,
    getTodayCheckIn: getTodayCheckIn,
    getTodayMetric: getTodayMetric,
    getStreak: getStreak,
    getCheckInCount: getCheckInCount,
    getPref: getPref,
    setPref: setPref,
    exportAll: exportAll,
    clearAll: clearAll
  };
})();
