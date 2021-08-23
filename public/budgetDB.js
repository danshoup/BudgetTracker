let db;
let budgetVersion;

// New request for indexedDB, budgetDB
const request = indexedDB.open("budgetDB", budgetVersion || 42);




request.onupgradeneeded = function (event) {
  console.log('Upgrade needed in IndexedDB');

  const { oldVersion } = event;
  const newVersion = event.newVersion || db.version;

  console.log(`DB updated from version ${oldVersion} to ${newVersion}`);

  db = event.target.result;

  if (db.objectStoreNames.length === 0) {
    db.createObjectStore('BudgetStore', { autoIncrement: true });
  }

};

request.onerror = function (event) {
  console.log(`Whoops! ${event.target.errorCode}`);
};

function checkDatabase() {
    console.log('Check DB Invoked');

    // Open transaction on BudgetStore DB
    let transaction = db.transaction(['BudgetStore'], 'readwrite');

    // Access BudgetStore object
    const store = transaction.objectStore('BudgetStore');

    // Get all store records and set to a variable
    const getAll = store.getAll();

    // Do this if successful request
    getAll.onsuccess = function () {
        // Bulk add items when back online if there are any in the store
        if (getAll.result.length > 0) {
            fetch('/api/transaction/bulk', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json',
                },
            })
                .then((response) => response.json())
                .then((res) => {
                    // If return is not empty
                    if (res.length !== 0) {
                        // Open another transaction to BudgetStore
                        transaction = db.transaction(['BudgetStore'], 'readwrite');

                        // Assign store to a variable
                        const currentStore = transaction.objectStore('BudgetStore');

                        // Clear existing entries because bulk add successful
                        currentStore.clear();
                        console.log('Clearing current store');
                    }
                });
        }
    };
};


request.onsuccess = function (event) {
    console.log('success');
    db = event.target.result;

    // Check online status of app before reading  from db
    if (navigator.online) {
        console.log('Backend is online!');
        checkDatabase();
    }
};


const saveRecord = (record) => {
    console.log('Save Record Invoked');

    // Create transaction on BudgetSTore DB
    const transaction = db.transaction(['BudgetStore'], 'readwrite');

    // Access BudgetStore object store
    const store = transaction.objectStore('BudgetStore');

    // Add record to store
    store.add(record);
};

// Listener for app back online
window.addEventListener('online', checkDatabase);

