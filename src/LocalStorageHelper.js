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
    return openDb('custom-assets', 3, upgradeDB => {
      switch (upgradeDB.oldVersion) {
        case 0:
          //nothing
        case 2:
          upgradeDB.createObjectStore('sound-recordings', {keyPath: 'assetId'});
        case 3:
          upgradeDB.createObjectStore('recordings', {keyPath: 'id', autoincrement: true});
      }
    });
  }


	loadByAssetId (assetId) {
    return this.dbPromise.then(function(db) {
      var tx = db.transaction('sound-recordings', 'readonly');
      var store = tx.objectStore('sound-recordings');
      var index = store.index('assetId');
      return index.get(assetId);
    });
  }

	store (assetType, dataFormat, data, assetId) {
    const asset = new Asset(assetType, assetId, dataFormat, data);

    this.dbPromise.then(function(db) {
      var tx = db.transaction('sound-recordings', 'readwrite');
      var store = tx.objectStore('sound-recordings');

      var items = [asset];
      return Promise.all(items.map(function(item) {
          console.log('LocalStorageHelper adding item: ', item);
          return store.add(item);
        })
      ).catch(function(e) {
        tx.abort();
        console.log(e);
      }).then(function() {
        console.log('LocalStorageHelper added recording successfully!');
      });
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
}

module.exports = LocalStorageHelper;