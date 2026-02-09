// MASTER ADMIN PASSWORD
const SKILLBEE_MASTER_KEY = "SkillBee@2026"; // Change this to your desired password!

function checkAdminPass() {
    const input = document.getElementById('masterPass').value;
    
    if (input === SKILLBEE_MASTER_KEY) {
        document.getElementById('adminLock').style.display = 'none';
        document.getElementById('adminContent').style.display = 'block';
        viewStudents(); // Automatically load the list
    } else {
        alert("Incorrect Master Password. Access Denied.");
    }
}
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

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
// [KEEP YOUR FIREBASE CONFIG AT THE TOP]

const SKILLBEE_MASTER_KEY = "SkillBee@2026";

function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
    document.getElementById(tabId).style.display = 'block';
}

// 1. ADMIN: UPLOAD CLASS TO COURSE
async function uploadClass() {
    const course = document.getElementById('uploadCourseSelect').value;
    const title = document.getElementById('classTitle').value;
    const link = formatYoutubeLink(document.getElementById('vLink').value);
    const notes = document.getElementById('classNotes').value;
    const pdf = document.getElementById('pdfLink').value;

    try {
        await db.collection("course_content").add({
            courseId: course,
            title: title,
            video: link,
            notes: notes,
            pdf: pdf,
            timestamp: new Date()
        });
        alert("Class Uploaded Successfully!");
    } catch (e) { alert(e.message); }
}

// 2. STUDENT: LOAD ASSIGNED LESSONS
function loadDashboard(uid) {
    db.collection("students").doc(uid).get().then(doc => {
        const studentData = doc.data();
        document.getElementById('assignedCourseName').innerText = studentData.courseName;
        
        // Fetch all classes for this student's course
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
                btn.style.marginBottom = "5px";
                btn.innerText = lesson.title;
                btn.onclick = () => playLesson(lesson);
                listDiv.appendChild(btn);
            });
        });
    });
}

function playLesson(lesson) {
    document.getElementById('mainVideo').src = lesson.video;
    document.getElementById('currentLessonTitle').innerText = lesson.title;
    document.getElementById('currentLessonNotes').innerText = lesson.notes;
    
    const pdfArea = document.getElementById('pdfArea');
    if(lesson.pdf) {
        pdfArea.innerHTML = `<a href="${lesson.pdf}" target="_blank" class="btn btn-access">Download PDF Notes</a>`;
    } else {
        pdfArea.innerHTML = "";
    }
}

// [KEEP YOUR PREVIOUS LOGIN, ADDSTUDENT, AND FORMATLINK FUNCTIONS]

// Security: Disable right-click
document.addEventListener('contextmenu', event => event.preventDefault());

function formatYoutubeLink(url) {
    if (url.includes("youtube.com/watch?v=")) {
        return url.replace("watch?v=", "embed/");
    } else if (url.includes("youtu.be/")) {
        return url.replace("youtu.be/", "youtube.com/embed/");
    }
    return url;
}

// ==========================================
// 2. ADMIN LOGIC (Manage Students)
// ==========================================

// Add a new student
async function addStudent() {
    const email = document.getElementById('sEmail').value;
    const pass = document.getElementById('sPass').value;
    const course = document.getElementById('sCourse').value;
    const rawVideo = document.getElementById('sVideoLink').value;
    const notes = document.getElementById('sNotes').value;

    const videoEmbed = formatYoutubeLink(rawVideo);

    if(!email || !pass || !rawVideo) {
        alert("Please fill all fields.");
        return;
    }

    try {
        const cred = await auth.createUserWithEmailAndPassword(email, pass);
        await db.collection("students").doc(cred.user.uid).set({
            email: email,
            courseName: course,
            videoUrl: videoEmbed,
            notes: notes,
            uid: cred.user.uid
        });
        alert("Student Added!");
        viewStudents(); // Refresh the list automatically
    } catch (e) { alert(e.message); }
}

// View all students in a table
function viewStudents() {
    const tableBody = document.getElementById('studentListTable');
    tableBody.innerHTML = "Loading...";

    db.collection("students").get().then((querySnapshot) => {
        tableBody.innerHTML = ""; // Clear loading text
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const row = `
                <tr style="border-bottom: 1px solid #ddd;">
                    <td style="padding: 10px;">${data.email}</td>
                    <td style="padding: 10px;">${data.courseName}</td>
                    <td style="padding: 10px;">
                        <button onclick="deleteStudent('${doc.id}')" style="color: red; border:none; background:none; cursor:pointer;">Delete</button>
                    </td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });
    });
}

// Delete student from Database
function deleteStudent(id) {
    if(confirm("Are you sure you want to remove this student from the database?")) {
        db.collection("students").doc(id).delete().then(() => {
            alert("Student removed from list.");
            viewStudents(); // Refresh table
        });
    }
}

// ==========================================
// 3. STUDENT LOGIC
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
            const data = doc.data();
            document.getElementById('userName').innerText = "Welcome, " + data.email;
            document.getElementById('courseTitle').innerText = data.courseName;
            document.getElementById('classNotes').innerText = data.notes;
            document.getElementById('lessonVideo').src = data.videoUrl + "?rel=0&modestbranding=1";
        }
    });
}

function logout() {
    auth.signOut().then(() => location.reload());
}