// ==========================================
// 1. FIREBASE CONFIGURATION
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyAh7zefE3t9drLe18k1CfwmGeS5XSwrrik",
  authDomain: "skillbee-8b8d6.firebaseapp.com",
  projectId: "skillbee-8b8d6",
  storageBucket: "skillbee-8b8d6.firebasestorage.app",
  messagingSenderId: "465284877801",
  appId: "1:465284877801:web:58db4d962a5778f4790f78"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();
const auth = firebase.auth();

// Master Admin Password
const SKILLBEE_MASTER_KEY = "SkillBee@2026";

// ==========================================
// 2. SECURITY & UTILS
// ==========================================

// Disable right-click for content protection
document.addEventListener('contextmenu', event => event.preventDefault());

// Format YouTube links to embed format
function formatYoutubeLink(url) {
    if (!url) return "";
    if (url.includes("youtube.com/watch?v=")) {
        return url.replace("watch?v=", "embed/");
    } else if (url.includes("youtu.be/")) {
        return url.replace("youtu.be/", "youtube.com/embed/");
    }
    return url;
}

// ==========================================
// 3. ADMIN ACCESS & TABS
// ==========================================

function checkAdminPass() {
    const input = document.getElementById('masterPass').value;
    if (input === SKILLBEE_MASTER_KEY) {
        document.getElementById('adminLock').style.display = 'none';
        document.getElementById('adminContent').style.display = 'block';
        viewStudents(); // Load list automatically on unlock
    } else {
        alert("Incorrect Master Password. Access Denied.");
    }
}

function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
    document.getElementById(tabId).style.display = 'block';
}

// ==========================================
// 4. ADMIN: STUDENT MANAGEMENT
// ==========================================

async function addStudent() {
    const email = document.getElementById('sEmail').value;
    const pass = document.getElementById('sPass').value;
    const courseName = document.getElementById('sCourse').options[document.getElementById('sCourse').selectedIndex].text;
    const courseId = document.getElementById('sCourse').value;

    if(!email || !pass) {
        alert("Please fill in email and password.");
        return;
    }

    try {
        const cred = await auth.createUserWithEmailAndPassword(email, pass);
        await db.collection("students").doc(cred.user.uid).set({
            email: email,
            courseName: courseName,
            courseId: courseId, // Used to match with course_content
            uid: cred.user.uid
        });
        alert("Student Added Successfully!");
        viewStudents();
    } catch (e) { alert(e.message); }
}

function viewStudents() {
    const tableBody = document.getElementById('studentListTable');
    if(!tableBody) return;
    tableBody.innerHTML = "Loading...";

    db.collection("students").get().then((querySnapshot) => {
        tableBody.innerHTML = "";
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const row = `
                <tr style="border-bottom: 1px solid #ddd;">
                    <td style="padding: 10px;">${data.email}</td>
                    <td style="padding: 10px;">${data.courseName}</td>
                    <td style="padding: 10px;">
                        <button onclick="deleteStudent('${doc.id}')" style="color: red; border:none; background:none; cursor:pointer;">Delete</button>
                    </td>
                </tr>`;
            tableBody.innerHTML += row;
        });
    });
}

function deleteStudent(id) {
    if(confirm("Are you sure you want to remove this student?")) {
        db.collection("students").doc(id).delete().then(() => {
            alert("Student removed.");
            viewStudents();
        });
    }
}

// ==========================================
// 5. ADMIN: CONTENT MANAGEMENT
// ==========================================

async function uploadClass() {
    const course = document.getElementById('uploadCourseSelect').value;
    const title = document.getElementById('classTitle').value;
    const link = formatYoutubeLink(document.getElementById('vLink').value);
    const notes = document.getElementById('classNotes').value;
    const pdf = document.getElementById('pdfLink').value;

    if(!title || !link) {
        alert("Please provide at least a title and a video link.");
        return;
    }

    try {
        await db.collection("course_content").add({
            courseId: course,
            title: title,
            video: link,
            notes: notes,
            pdf: pdf,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        alert("Class Uploaded Successfully!");
        // Clear inputs
        document.getElementById('classTitle').value = "";
        document.getElementById('vLink').value = "";
        document.getElementById('classNotes').value = "";
        document.getElementById('pdfLink').value = "";
    } catch (e) { alert(e.message); }
}

// ==========================================
// 6. STUDENT LOGIC
// ==========================================

function login() {
    const email = document.getElementById('lEmail').value;
    const pass = document.getElementById('lPass').value;

    auth.signInWithEmailAndPassword(email, pass).then((cred) => {
        document.getElementById('loginView').style.display = 'none';
        document.getElementById('dashView').style.display = 'block';
        loadDashboard(cred.user.uid);
    }).catch(e => alert(e.message));
}

function loadDashboard(uid) {
    db.collection("students").doc(uid).get().then(doc => {
        if (doc.exists) {
            const studentData = doc.data();
            document.getElementById('userName').innerText = "Welcome, " + studentData.email;
            document.getElementById('assignedCourseName').innerText = studentData.courseName;
            
            // Fetch all classes for this student's assigned course ID
            db.collection("course_content")
              .where("courseId", "==", studentData.courseId)
              .orderBy("timestamp", "asc")
              .get().then(querySnapshot => {
                const listDiv = document.getElementById('lessonList');
                listDiv.innerHTML = "";
                querySnapshot.forEach(classDoc => {
                    const lesson = classDoc.data();
                    const btn = document.createElement('button');
                    btn.className = "btn btn-enroll";
                    btn.style.width = "100%";
                    btn.style.marginBottom = "8px";
                    btn.innerText = lesson.title;
                    btn.onclick = () => playLesson(lesson);
                    listDiv.appendChild(btn);
                });
            });
        }
    });
}

function playLesson(lesson) {
    document.getElementById('mainVideo').src = lesson.video + "?rel=0&modestbranding=1";
    document.getElementById('currentLessonTitle').innerText = lesson.title;
    document.getElementById('currentLessonNotes').innerText = lesson.notes;
    
    const pdfArea = document.getElementById('pdfArea');
    if(lesson.pdf) {
        pdfArea.innerHTML = `<a href="${lesson.pdf}" target="_blank" class="btn btn-access">Download PDF Notes</a>`;
    } else {
        pdfArea.innerHTML = "";
    }
}

function logout() {
    auth.signOut().then(() => location.reload());
}