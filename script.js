// ==========================================
// 1. FIREBASE CONFIGURATION (The Brain)
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyAh7zefE3t9drLe18k1CfwmGeS5XSwrrik",
  authDomain: "skillbee-8b8d6.firebaseapp.com",
  projectId: "skillbee-8b8d6",
  storageBucket: "skillbee-8b8d6.firebasestorage.app",
  messagingSenderId: "465284877801",
  appId: "1:465284877801:web:58db4d962a5778f4790f78"
};

// Initialize Firebase Tools
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// ==========================================
// 2. SECURITY FEATURES
// ==========================================
// Disable right-click to protect SkillBee video content
document.addEventListener('contextmenu', event => event.preventDefault());

/**
 * Automatically converts standard YouTube links or mobile links 
 * into the correct 'Embed' format so they work in your website.
 */
function formatYoutubeLink(url) {
    if (url.includes("youtube.com/watch?v=")) {
        return url.replace("watch?v=", "embed/");
    } else if (url.includes("youtu.be/")) {
        return url.replace("youtu.be/", "youtube.com/embed/");
    }
    return url;
}

// ==========================================
// 3. ADMIN LOGIC (Managing Classes)
// ==========================================
async function addStudent() {
    const email = document.getElementById('sEmail').value;
    const pass = document.getElementById('sPass').value;
    const course = document.getElementById('sCourse').value;
    const rawVideo = document.getElementById('sVideoLink').value;
    const notes = document.getElementById('sNotes').value;

    // Convert the link to embed format
    const videoEmbed = formatYoutubeLink(rawVideo);

    if(!email || !pass || !rawVideo) {
        alert("Please fill in all fields before submitting.");
        return;
    }

    try {
        // Create the student account in Firebase Authentication
        const cred = await auth.createUserWithEmailAndPassword(email, pass);
        
        // Save the student's specific class data to the Database
        await db.collection("students").doc(cred.user.uid).set({
            email: email,
            courseName: course,
            videoUrl: videoEmbed,
            notes: notes,
            createdAt: new Date()
        });
        
        alert("Student Account Created & Class Assigned Successfully!");
        // Clear the form
        document.getElementById('sEmail').value = "";
        document.getElementById('sPass').value = "";
        document.getElementById('sVideoLink').value = "";
        document.getElementById('sNotes').value = "";
        
    } catch (e) { 
        alert("Error: " + e.message); 
    }
}

// ==========================================
// 4. STUDENT LOGIC (Dashboard)
// ==========================================
function login() {
    const email = document.getElementById('lEmail').value;
    const pass = document.getElementById('lPass').value;

    auth.signInWithEmailAndPassword(email, pass)
    .then((cred) => {
        // Hide Login UI and show Dashboard
        document.getElementById('loginView').style.display = 'none';
        document.getElementById('dashView').style.display = 'block';
        loadDashboard(cred.user.uid);
    }).catch(e => alert("Login Failed: " + e.message));
}

/**
 * Fetches the student's assigned video and notes from the database.
 */
function loadDashboard(uid) {
    db.collection("students").doc(uid).get().then(doc => {
        if (doc.exists) {
            const data = doc.data();
            
            // Personalize the dashboard
            document.getElementById('userName').innerText = "Welcome, " + data.email;
            document.getElementById('courseTitle').innerText = data.courseName;
            document.getElementById('classNotes').innerText = data.notes || "No additional notes provided.";
            
            // Inject the video link with extra security parameters
            // rel=0 hides related videos; modestbranding=1 hides YouTube logo
            document.getElementById('lessonVideo').src = data.videoUrl + "?rel=0&modestbranding=1&autoplay=0";
        } else {
            alert("No course data found for this account.");
        }
    });
}

// Simple logout function
function logout() {
    auth.signOut().then(() => {
        window.location.reload();
    });
}