const nets = require('nets');

const log = require('./log');

const Asset = require('./Asset');
const Helper = require('./Helper');

const openDb = require('idb').openDb;
const deleteDb = require('idb').deleteDb;

// Notes from Tina:
// Because I'm looking to only store sound recordings...
// I'm not sure I even need a list of stores.
// For now, i'll use a single store.

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
      this.store = [];
      this.dbPromise = this.openAndUpgradeDatabase();
  }

  openAndUpgradeDatabase(upgradeDb) {
    return idb.open('custom-assets', 1, function(upgradeDb) {
      switch (upgradeDb.oldVersion) {
        case 0:
          // a placeholder case so that the switch block will
          // execute when the database is first created
          // (oldVersion is 0)
        case 1: // TODO(quacht): What's the point of breaking this up into cases?
          console.log('Creating the recordings object store');
          upgradeDb.createObjectStore('recordings', {keyPath: 'id'});

        // 4.1 - create 'name' index
        case 2:
          console.log('Creating a name index');
          var store = upgradeDb.transaction.objectStore('products');
          store.createIndex('name', 'name', {unique: true});

        // 4.2 - create 'price' and 'description' indexes
        case 3:
          console.log('Create description indexes');
          var store = upgradeDb.transaction.objectStore('products');
          store.createIndex('description', 'description');
      }
    });
  }


	loadByAssetId (assetId) {
    return dbPromise.then(function(db) {
      var tx = db.transaction('recordings', 'readonly');
      var store = tx.objectStore('recordings');
      var index = store.index('assetId');
      return index.get(assetId);
    });
  }

	store (assetType, dataFormat, data, assetId) {
    const asset = new Asset(assetType, assetId, dataFormat);

    dbPromise.then(function(db) {
      var tx = db.transaction('recordings', 'readwrite');
      var store = tx.objectStore('recordings');

      // TODO(quacht): Can I directly store an Asset or does it need to be represented as a basic
      // javascript object?
      var items = [asset];
      return Promise.all(items.map(function(item) {
          console.log('Adding item: ', item);
          return store.add(item);
        })
      ).catch(function(e) {
        tx.abort();
        console.log(e);
      }).then(function() {
        console.log('added recording successfully!');
      });
  }
}

module.exports = LocalStorageHelper;
