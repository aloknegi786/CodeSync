import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("User logged in:", user);
    } else {
        console.log("User logged out");
    }
});