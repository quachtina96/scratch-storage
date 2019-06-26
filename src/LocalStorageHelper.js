/**
 * @fileoverview define the LocalStorageHelper which stores to and loads from
 * indexedDB.
 */
const nets = require('nets');

const log = require('./log');

const Asset = require('./Asset');
const Helper = require('./Helper');

const idb = require('idb');
const openDb = idb.openDb;
const deleteDb = idb.deleteDb;

class LocalStorageHelper extends Helper {
  constructor (parent) {
      super(parent);

      /**
       * @type {Array.<StoreRecord>}
       * @typedef {object} StoreRecord
       * @property {Array.<string>} types - The types of asset provided by this store, from AssetType's name field.
       * @property {UrlFunction} getFunction - A function which computes a URL from an Asset.
       * @property {UrlFunction} createFunction - A function which computes a URL from an Asset.
       * @property {UrlFunction} updateFunction - A function which computes a URL from an Asset.
       */
      this.stores = [];
      this.dbPromise = this.openAndUpgradeDatabase();
  }

  /**
   * This method gets called everytime you want to update the database
   * @param {Integer} version of update to execute
   */
  openAndUpgradeDatabase(upgradeDb) {
    return openDb('custom-assets', 4, upgradeDB => {
      switch (upgradeDB.oldVersion) {
        case 0:
          //nothing
        case 2:
          upgradeDB.createObjectStore('sound-recordings', {keyPath: 'assetId'});
        case 3:
          // upgradeDB.createObjectStore('recordings', {keyPath: 'id', autoincrement: true});
        case 4:
          upgradeDB.createObjectStore('vmSounds', {keyPath: 'name'});
      }
    });
  }

	store (assetType, dataFormat, data, assetId, vmSound) {
    const asset = new Asset(assetType, assetId, dataFormat, data);

    return this.dbPromise.then(function(db) {
      var vmSoundsTx = db.transaction('vmSounds', 'readwrite');
      var tx = db.transaction('sound-recordings', 'readwrite');

      try {
        var vmSoundsStore = vmSoundsTx.objectStore('vmSounds');
        vmSoundsStore.add(vmSound).then(function() {
          console.log('LocalStorageHelper added vmsound successfully!');
        });
      } catch (e) {
        console.log(e);
        vmSoundsTx.abort();
      }

      try {
        var store = tx.objectStore('sound-recordings');
        store.add(asset).then(function() {
          console.log('LocalStorageHelper added recording successfully!');
        });
      } catch (e) {
        console.log(e);
      }
    });
  }

  /**
   * Fetch an asset but don't process dependencies.
   * @param {AssetType} assetType - The type of asset to fetch.
   * @param {string} assetId - The ID of the asset to fetch: a project ID, MD5, etc.
   * @param {DataFormat} dataFormat - The file format / file extension of the asset to fetch: PNG, JPG, etc.
   * @return {Promise.<Asset>} A promise for the contents of the asset.
   */
  load (assetType, assetId, dataFormat) {
    return this.dbPromise.then(function(db) {
      var tx = db.transaction('sound-recordings', 'readonly');
      var store = tx.objectStore('sound-recordings');
      var result = store.get(assetId);
      return result
    });
  }

  /**
   * Fetch an asset but don't process dependencies.
   * @param {string} soundName - The name of the vm sound recording to fetch.
   * @return {Promise.<Asset>} A promise for the contents of the asset.
   */
  loadVmSound (soundName) {
    return this.dbPromise.then(function(db) {
      var tx = db.transaction('vmSounds', 'readonly');
      var store = tx.objectStore('vmSounds');
      return store.get(soundName);
    });
  }

  deleteVmSound (soundName) {
    return this.dbPromise.then(function(db) {
      var vmSoundsTx = db.transaction('vmSounds', 'readwrite');

      try {
        var vmSoundsStore = vmSoundsTx.objectStore('vmSounds');
        vmSoundsStore.delete(soundName).then(function() {
          console.log(`LocalStorageHelper deleted vmsound called ${soundName}!`);
        });
      } catch (e) {
        console.log(e);
        vmSoundsTx.abort();
      }
    });
  }

  storeVmSound (vmSound) {
    return this.dbPromise.then(function(db) {
      var vmSoundsTx = db.transaction('vmSounds', 'readwrite');

      try {
        var vmSoundsStore = vmSoundsTx.objectStore('vmSounds');
        vmSoundsStore.add(vmSound).then(function() {
          console.log('LocalStorageHelper added vmsound successfully!');
        });
      } catch (e) {
        console.log(e);
        vmSoundsTx.abort();
      }
    });
  }

  getAllRecordings() {
    return this.dbPromise.then(function(db) {
      var vmSoundsTx = db.transaction('vmSounds', 'readonly');

      try {
        var vmSoundsStore = vmSoundsTx.objectStore('vmSounds');
        return vmSoundsStore.getAllKeys();
      } catch (e) {
        console.log(e);
        vmSoundsTx.abort();
      }
    });
  }
}

module.exports = LocalStorageHelper;