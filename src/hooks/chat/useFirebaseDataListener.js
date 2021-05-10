import { useEffect, useState } from 'react';

import firebase from 'firebase/app';
import 'firebase/database';

const useFirebaseDataListener = dbPath => {
    const firebaseDB = firebase.database();

    const [dataReference, setDataReference] = useState(null);

    useEffect(() => {
        const firebaseReference = firebaseDB.ref(dbPath);
        firebaseReference.on("value", snapshot => {
            const data = snapshot.val();
            setDataReference(data);
        });

        return () => {firebaseReference.off();}
    }, [firebaseDB, dbPath]);

    return dataReference;
};

export default useFirebaseDataListener;