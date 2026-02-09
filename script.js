const firebaseConfig = {
  apiKey: "AIzaSyAh7zefE3t9drLe18k1CfwmGeS5XSwrrik",
  authDomain: "skillbee-8b8d6.firebaseapp.com",
  projectId: "skillbee-8b8d6",
  storageBucket: "skillbee-8b8d6.firebasestorage.app",
  messagingSenderId: "465284877801",
  appId: "1:465284877801:web:58db4d962a5778f4790f78"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// ADMIN: Create Student Account
async function createStudent() {
    const email = document.getElementById('studentEmail').value;
    const pass = document.getElementById('studentPass').value;
    const course = document.getElementById('courseSelect').value;

    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, pass);
        await db.collection("students").doc(userCredential.user.uid).set({
            email: email,
            assignedCourse: course
        });
        alert("Student added successfully!");
    } catch (error) {
        alert(error.message);
    }
}

// STUDENT: Login
function loginStudent() {
    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPass').value;

    auth.signInWithEmailAndPassword(email, pass)
    .then((userCredential) => {
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('dashboardSection').style.display = 'block';
        loadStudentData(userCredential.user.uid);
    })
    .catch(error => alert(error.message));
}

// LOAD DATA
function loadStudentData(uid) {
    db.collection("students").doc(uid).get().then(doc => {
        const data = doc.data();
        document.getElementById('welcomeMsg').innerText = "Hello, " + data.email;
        // Logic to show course video based on data.assignedCourse goes here
    });
}