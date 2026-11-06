
/* =========================================================
   GREY MATTER STUDY HUB
   Complete Main JavaScript File
   Student Frontend
   ========================================================= */


/* =========================================================
   1. THEME MANAGEMENT
   ========================================================= */

function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("greyMatterTheme", theme);
    updateThemeButton();
}

function updateThemeButton() {
    document.querySelectorAll("#themeToggle").forEach(button => {
        const dark =
            document.documentElement.getAttribute("data-theme") === "dark";

        button.textContent = dark ? "☀️ Light Mode" : "🌙 Dark Mode";
        button.setAttribute("aria-pressed", String(dark));
    });
}


/* =========================================================
   2. PASSWORD SECURITY
   ========================================================= */

function bytesToHex(bytes) {
    return Array.from(bytes)
        .map(byte => byte.toString(16).padStart(2, "0"))
        .join("");
}

function hexToBytes(hex) {
    const bytes = new Uint8Array(hex.length / 2);

    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
    }

    return bytes;
}

async function hashPassword(password, salt) {
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(password),
        "PBKDF2",
        false,
        ["deriveBits"]
    );

    const bits = await crypto.subtle.deriveBits(
        {
            name: "PBKDF2",
            salt,
            iterations: 310000,
            hash: "SHA-256"
        },
        keyMaterial,
        256
    );

    return bytesToHex(new Uint8Array(bits));
}


/* =========================================================
   3. REGISTRATION
   ========================================================= */

/* =========================================================
   3. REGISTRATION
   ========================================================= */

const registerForm = document.getElementById("registerForm");

if (registerForm) {
    registerForm.addEventListener("submit", async event => {
        event.preventDefault();

        const fullname =
            document.getElementById("fullname").value.trim();

        const email =
            document.getElementById("registerEmail").value.trim();

        const password =
            document.getElementById("registerPassword").value;

        const confirmPassword =
            document.getElementById("confirmPassword").value;

        if (!fullname || !email || !password || !confirmPassword) {
            alert("Please complete all required fields.");
            return;
        }

        if (password.length < 8) {
            alert("Password must contain at least 8 characters.");
            return;
        }

        if (password !== confirmPassword) {
            alert("Passwords do not match.");
            return;
        }

        if (!window.crypto || !crypto.subtle) {
            alert("Secure password storage is not supported by this browser.");
            return;
        }

        // CHECK FOR AN EXISTING ACCOUNT
        let existingUser = null;

        const savedUser = localStorage.getItem("greyMatterUser");

        if (savedUser) {
            try {
                existingUser = JSON.parse(savedUser);
            } catch (error) {
                alert("Unable to read the existing account.");
                return;
            }

            if (!existingUser || !existingUser.email) {
                alert("The existing account data is invalid.");
                return;
            }

            if (email.toLowerCase() !== existingUser.email.toLowerCase()) {
                alert("The email must match your existing account.");
                return;
            }

            if (existingUser.passwordSalt && existingUser.passwordHash) {
                alert("An account already exists with updated password security.");
                return;
            }
        }

        try {
            const salt = crypto.getRandomValues(new Uint8Array(16));
            const passwordHash = await hashPassword(password, salt);

            // PRESERVE EXISTING ACCOUNT DETAILS
            const accountData = existingUser
                ? {
                    ...existingUser,
                    passwordSalt: bytesToHex(salt),
                    passwordHash
                }
                : {
                    fullname,
                    email,
                    course: "",
                    studentNumber: "",
                    passwordSalt: bytesToHex(salt),
                    passwordHash
                };

            localStorage.setItem(
                "greyMatterUser",
                JSON.stringify(accountData)
            );

            alert(
                existingUser
                    ? "Your password has been successfully updated!"
                    : "Registration successful! You can now log in."
            );

            window.location.href = "index.html";

        } catch (error) {
            console.error("Registration error:", error);
            alert("Something went wrong during registration.");
        }
    });
}


/* =========================================================
   4. LOGIN
   ========================================================= */

const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async event => {
        event.preventDefault();

        const email =
            document.getElementById("email").value.trim();

        const password =
            document.getElementById("password").value;

        const savedUser = localStorage.getItem("greyMatterUser");

        if (!savedUser) {
            alert("No account found. Please register first.");
            return;
        }

        try {
            const user = JSON.parse(savedUser);

            // CHECK PASSWORD SECURITY DATA
if (!user.passwordSalt || !user.passwordHash) {
    alert(
        "This account uses an older registration format. " +
        "Please create a new account to continue."
    );
    return;
}

            if (email.toLowerCase() !== user.email.toLowerCase()) {
                alert("Incorrect email or password.");
                return;
            }

            const salt = hexToBytes(user.passwordSalt);
            const enteredHash = await hashPassword(password, salt);

            if (enteredHash !== user.passwordHash) {
                alert("Incorrect email or password.");
                return;
            }

            sessionStorage.setItem("loggedIn", "true");
            window.location.href = "dashboard.html";

        } catch (error) {
            console.error("Login error:", error);
            alert("Something went wrong while logging in.");
        }
    });
}


/* =========================================================
   5. DASHBOARD ACCESS
   ========================================================= */

const dashboardContent =
    document.getElementById("dashboardContent");

if (dashboardContent) {

    if (sessionStorage.getItem("loggedIn") !== "true") {
        window.location.href = "index.html";
    } else {


        /* =================================================
           6. DASHBOARD VARIABLES
           ================================================= */

        const homeContent = dashboardContent.innerHTML;

        const dashboardTitle =
            document.querySelector(".dashboard-header h1");

        const dashboardSubtitle =
            document.querySelector(".dashboard-header p");

        const titles = {
            dashboard: "Dashboard",
            profile: "My Profile",
            subjects: "Subjects",
            activity: "Activity",
            lessons: "Lessons / Reviewers",
            settings: "Settings"
        };

        let currentActivityId = null;
        let currentSubjectId = null;
        let currentLessonId = null;
        let currentStudyStart = null;
        let studyTimer = null;

        const sections = {
            profile: `
                <div class="portal-section">
                    <div class="section-heading">
                        <h2>My Profile</h2>
                        <p>Manage your student information.</p>
                    </div>

                    <form id="profileForm" class="profile-form">
                        <div class="form-group">
                            <label for="profileFullname">Full Name</label>
                            <input type="text" id="profileFullname" disabled required>
                        </div>

                        <div class="form-group">
                            <label for="profileEmail">Email Address</label>
                            <input type="email" id="profileEmail" disabled required>
                        </div>

                        <div class="form-group">
                            <label for="profileCourse">Course / Strand</label>
                            <input type="text" id="profileCourse" disabled>
                        </div>

                        <div class="form-group">
                            <label for="profileStudentNumber">Student Number</label>
                            <input type="text" id="profileStudentNumber" disabled>
                        </div>

                        <p id="profileMessage" class="form-message"></p>

                        <button type="button" id="editProfileButton" class="portal-button">
                            Edit Profile
                        </button>
                    </form>
                </div>
            `
        };


        /* =================================================
           7. GENERAL HELPERS
           ================================================= */

        function escapeHTML(value) {
            return String(value ?? "").replace(/[&<>"']/g, character => ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"
            })[character]);
        }

        function getSavedUser() {
            try {
                return JSON.parse(localStorage.getItem("greyMatterUser")) || {};
            } catch {
                return {};
            }
        }

        function saveUser(user) {
            localStorage.setItem("greyMatterUser", JSON.stringify(user));
        }

        function formatDate(value) {
            if (!value) return "No date available";

            return new Date(value).toLocaleString([], {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit"
            });
        }

        function formatFileSize(bytes) {
            if (!bytes) return "0 KB";

            if (bytes < 1024 * 1024) {
                return (bytes / 1024).toFixed(1) + " KB";
            }

            return (bytes / (1024 * 1024)).toFixed(2) + " MB";
        }

        function readStorage(key, fallback) {
            try {
                const value = JSON.parse(localStorage.getItem(key));
                return value ?? fallback;
            } catch {
                return fallback;
            }
        }

        function writeStorage(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (error) {
                console.error("Storage error:", error);
                return false;
            }
        }


        /* =================================================
           8. NOTIFICATION PREFERENCES
           ================================================= */

        const NOTIFICATION_STORAGE_KEY =
            "greyMatterNotificationPreferences";

        const defaultNotificationPreferences = {
            activityReminders: true,
            announcementNotifications: true
        };

        function getNotificationPreferences() {
            const saved = readStorage(
                NOTIFICATION_STORAGE_KEY,
                defaultNotificationPreferences
            );

            return {
                activityReminders:
                    typeof saved.activityReminders === "boolean"
                        ? saved.activityReminders : true,

                announcementNotifications:
                    typeof saved.announcementNotifications === "boolean"
                        ? saved.announcementNotifications : true
            };
        }

        function saveNotificationPreferences(preferences) {
            return writeStorage(NOTIFICATION_STORAGE_KEY, preferences);
        }


        /* =================================================
           9. SETTINGS PAGE
           ================================================= */

        function renderSettings() {
            const user = getSavedUser();
            const preferences = getNotificationPreferences();

            return `
                <div class="subjects-portal settings-page">

                    <div class="portal-section">
                        <div class="section-heading">
                            <h2>Settings</h2>
                            <p>Manage your account information and customize your Study Hub experience.</p>
                        </div>
                    </div>

                    <div class="settings-card">
                        <div class="settings-card-heading">
                            <div>
                                <h3>Appearance</h3>
                                <p>Change the visual theme of your Study Hub.</p>
                            </div>
                        </div>

                        <div class="settings-card-content">
                            <div class="settings-theme-row">
                                <div>
                                    <strong>Display Theme</strong>
                                    <p>Choose between dark mode and light mode.</p>
                                </div>

                                <button type="button" id="themeToggle" class="portal-button">
                                    Toggle Theme
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="settings-card">
                        <div class="settings-card-heading">
                            <div>
                                <h3>Account Preferences</h3>
                                <p>Review your saved student information.</p>
                            </div>
                        </div>

                        <div class="settings-card-content">
                            <div class="settings-info-list">
                                <div class="settings-info-row">
                                    <span>Full Name</span>
                                    <strong>${escapeHTML(user.fullname || "Not provided")}</strong>
                                </div>

                                <div class="settings-info-row">
                                    <span>Email Address</span>
                                    <strong>${escapeHTML(user.email || "Not provided")}</strong>
                                </div>

                                <div class="settings-info-row">
                                    <span>Course / Strand</span>
                                    <strong>${escapeHTML(user.course || "Not provided")}</strong>
                                </div>

                                <div class="settings-info-row">
                                    <span>Student Number</span>
                                    <strong>${escapeHTML(user.studentNumber || "Not provided")}</strong>
                                </div>
                            </div>

                            <p class="settings-helper-text">
                                To change your information, visit My Profile.
                            </p>
                        </div>
                    </div>

                    <div class="settings-card">
                        <div class="settings-card-heading">
                            <div>
                                <h3>Notification Preferences</h3>
                                <p>Choose which types of updates you would like to enable.</p>
                            </div>
                        </div>

                        <div class="settings-card-content">
                            <div class="settings-toggle-list">

                                <label class="settings-toggle-row">
                                    <span class="settings-toggle-description">
                                        <strong>Activity Reminders</strong>
                                        <small>Enable reminders for upcoming activities and deadlines.</small>
                                    </span>

                                    <span class="settings-switch">
                                        <input
                                            type="checkbox"
                                            data-notification-setting="activityReminders"
                                            ${preferences.activityReminders ? "checked" : ""}
                                        >
                                        <span class="settings-switch-slider"></span>
                                    </span>
                                </label>

                                <label class="settings-toggle-row">
                                    <span class="settings-toggle-description">
                                        <strong>Announcement Notifications</strong>
                                        <small>Enable notifications for new subject announcements.</small>
                                    </span>

                                    <span class="settings-switch">
                                        <input
                                            type="checkbox"
                                            data-notification-setting="announcementNotifications"
                                            ${preferences.announcementNotifications ? "checked" : ""}
                                        >
                                        <span class="settings-switch-slider"></span>
                                    </span>
                                </label>

                            </div>

                            <p id="notificationPreferenceMessage" class="settings-helper-text" aria-live="polite">
                                Your preferences are saved automatically.
                            </p>

                            <p class="settings-notice">
                                These preferences are saved in your browser. Actual notifications are not activated yet.
                            </p>
                        </div>
                    </div>

                    <div class="settings-card">
                        <div class="settings-card-heading">
                            <div>
                                <h3>About Grey Matter Study Hub</h3>
                                <p>Learn more about this student learning portal.</p>
                            </div>
                        </div>

                        <div class="settings-card-content">
                            <div class="settings-about">
                                <div class="settings-about-logo">GM</div>

                                <div>
                                    <h4>Grey Matter Study Hub</h4>
                                    <span class="settings-version">Version 1.0</span>
                                </div>
                            </div>

                            <p class="settings-about-description">
                                Grey Matter Study Hub is a student portal designed to help students access subjects, lessons, reviewers, activities, and submissions in one organized space.
                            </p>

                            <p class="settings-helper-text">Designed as a learning project.</p>
                        </div>
                    </div>

                    <!-- ACCOUNT ACTIONS -->
                    <div class="settings-card">
                        <div class="settings-card-heading">
                            <div>
                                <h3>Account Actions</h3>
                                <p>Manage your current Study Hub session.</p>
                            </div>
                        </div>

                        <div class="settings-card-content">
                            <div class="settings-theme-row">
                                <div>
                                    <strong>Logout</strong>
                                    <p>Sign out of your account and return to the login page.</p>
                                </div>

                                <button
                                    type="button"
                                    id="settingsLogoutButton"
                                    class="portal-button settings-logout-button">
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            `;
        }


        /* =================================================
           10. PROFILE BADGE
           ================================================= */

        function updateProfileBadge() {
            const user = getSavedUser();

            document.querySelectorAll(
                "#userName, .user-name, #profileName"
            ).forEach(element => {
                element.textContent = user.fullname || "Student";
            });

            document.querySelectorAll(
                "#userEmail, .user-email"
            ).forEach(element => {
                element.textContent = user.email || "";
            });

            document.querySelectorAll(
                "#userInitial, .user-initial"
            ).forEach(element => {
                element.textContent =
                    (user.fullname || "S").charAt(0).toUpperCase();
            });

            const welcome = document.querySelector(".welcome-panel h2");

            if (welcome) {
                welcome.textContent =
                    `Welcome back, ${user.fullname || "Student"}!`;
            }
        }
/* =================================================
   PROFILE PICTURE DISPLAY
   ================================================= */

let profilePictureURL = null;

function displayProfilePicture(imageBlob) {
    const image = document.getElementById("profileAvatarImage");
    const initial = document.getElementById("userInitial");

    const removeButton =
        document.getElementById("removeProfilePictureButton");

    if (!image || !initial) return;

    // Show or hide the Remove Photo button
    if (removeButton) {
        removeButton.hidden = !imageBlob;
    }

    // Release the previous image URL, if one exists
    if (profilePictureURL) {
        URL.revokeObjectURL(profilePictureURL);
        profilePictureURL = null;
    }

    if (imageBlob) {
        profilePictureURL = URL.createObjectURL(imageBlob);

        image.src = profilePictureURL;
        image.hidden = false;
        initial.hidden = true;

    } else {
        image.removeAttribute("src");
        image.hidden = true;
        initial.hidden = false;
    }
}

/* =================================================
   LOAD SAVED PROFILE PICTURE
   ================================================= */

async function loadProfilePicture() {
    try {
        const savedPicture = await getProfilePicture();

        displayProfilePicture(savedPicture);

    } catch (error) {
        console.error("Unable to load profile picture:", error);
    }
}

/* =================================================
   REMOVE PROFILE PICTURE
   ================================================= */

async function removeProfilePicture() {
    try {
        await deleteProfilePicture();

        displayProfilePicture(null);

    } catch (error) {
        console.error("Unable to remove profile picture:", error);
        alert("Unable to remove your profile picture. Please try again.");
    }
}

const removeProfilePictureButton =
    document.getElementById("removeProfilePictureButton");

if (removeProfilePictureButton) {
    removeProfilePictureButton.addEventListener("click", async () => {
        await removeProfilePicture();
    });
}

/* =================================================
   PROFILE PICTURE UPLOAD
   ================================================= */

const profileAvatarButton =
    document.getElementById("profileAvatarButton");

const profilePictureInput =
    document.getElementById("profilePictureInput");

if (profileAvatarButton && profilePictureInput) {

    profileAvatarButton.addEventListener("click", () => {
        profilePictureInput.click();
    });

}

if (profilePictureInput) {

    profilePictureInput.addEventListener("change", async () => {

        const file = profilePictureInput.files[0];

        if (!file) return;

        // Check whether the selected file is an image
        if (!file.type.startsWith("image/")) {
            alert("Please select a valid image file.");
            profilePictureInput.value = "";
            return;
        }

        // Limit image size to 5 MB
        if (file.size > 5 * 1024 * 1024) {
            alert("Image size must not exceed 5 MB.");
            profilePictureInput.value = "";
            return;
        }

        try {
            await saveProfilePicture(file);

            displayProfilePicture(file);

        } catch (error) {
            console.error("Unable to save profile picture:", error);
            alert("Unable to save your profile picture. Please try again.");

        } finally {
            profilePictureInput.value = "";
        }

    });

}

        /* =================================================
           11. DATE AND TIME
           ================================================= */

        function updateDateTime() {
            const dateElement = document.getElementById("currentDate");
            const timeElement = document.getElementById("currentTime");
            const now = new Date();

            if (dateElement) {
                dateElement.textContent = now.toLocaleDateString(undefined, {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                });
            }

            if (timeElement) {
                timeElement.textContent = now.toLocaleTimeString(undefined, {
                    hour: "numeric",
                    minute: "2-digit",
                    second: "2-digit"
                });
            }
        }


        /* =================================================
           12. SUBJECT AND ACTIVITY DATA
           ================================================= */

        const subjects = [
            {
                id: "programming",
                name: "Computer Programming",
                code: "CP",
                description: "Learn programming fundamentals, problem-solving, and basic C++ programming.",
                announcements: [{
                    title: "Welcome to Computer Programming",
                    message: "Welcome! This subject introduces basic programming concepts.",
                    date: "Sample announcement"
                }],
                activities: [{
                    id: "cpp-calculator",
                    title: "Basic C++ Calculator",
                    description: "Create a simple calculator program using C++.",
                    instructions: "Create a C++ program that accepts two numbers and allows addition, subtraction, multiplication, and division. Display the result of the selected operation.",
                    deadline: "Sample deadline: December 15, 2026",
                    deadlineAt: "2026-12-15T23:59:59"
                }]
            },
            {
                id: "database",
                name: "Database Management",
                code: "DB",
                description: "Understand databases, tables, records, and basic SQL commands.",
                announcements: [{
                    title: "Introduction to Database Management",
                    message: "This subject introduces database concepts and SQL operations.",
                    date: "Sample announcement"
                }],
                activities: [{
                    id: "sql-exercise",
                    title: "SQL Queries Exercise",
                    description: "Practice the basic SQL commands.",
                    instructions: "Write SQL queries demonstrating SELECT, INSERT, UPDATE, and DELETE. Include a short explanation of each query.",
                    deadline: "Sample deadline: December 18, 2026",
                    deadlineAt: "2026-12-18T23:59:59"
                }]
            },
            {
                id: "web-development",
                name: "Web Development",
                code: "WD",
                description: "Explore how websites are created using HTML, CSS, and JavaScript.",
                announcements: [{
                    title: "Welcome to Web Development",
                    message: "You will learn how to create and style basic webpages.",
                    date: "Sample announcement"
                }],
                activities: [{
                    id: "personal-webpage",
                    title: "Personal Webpage",
                    description: "Create a simple personal webpage using HTML and CSS.",
                    instructions: "Create a personal webpage containing your name, a short introduction, your interests, and your contact information. Use HTML for structure and CSS for design.",
                    deadline: "Sample deadline: December 20, 2026",
                    deadlineAt: "2026-12-20T23:59:59"
                }]
            },
            {
                id: "introduction-computing",
                name: "Introduction to Computing",
                code: "IC",
                description: "Study the basic concepts, history, and components of computers.",
                announcements: [{
                    title: "Introduction to Computing",
                    message: "This subject covers the basic concepts and components of computers.",
                    date: "Sample announcement"
                }],
                activities: [{
                    id: "computer-components",
                    title: "Computer Components Research",
                    description: "Identify and explain the basic components of a computer.",
                    instructions: "Research the basic components of a computer. Identify each component and explain its purpose. Include examples where possible.",
                    deadline: "Sample deadline: December 22, 2026",
                    deadlineAt: "2026-12-22T23:59:59"
                }]
            }
        ];

        const allowedExtensions = [
            "cpp", "h", "sql", "html", "css", "js", "txt",
            "pdf", "doc", "docx", "ppt", "pptx", "zip"
        ];

        const MAX_FILE_SIZE = 10 * 1024 * 1024;


        /* =================================================
           13. LESSON AND REVIEWER CONTENT
           ================================================= */

        const learningMaterials = [
            {
                id: "programming-intro",
                subjectId: "programming",
                title: "Introduction to Programming",
                type: "lesson",
                description: "Learn what programming is and how programs solve problems.",
                duration: "15 min",
                content: [
                    {
                        heading: "What is Programming?",
                        body: "Programming is the process of giving instructions to a computer so it can perform specific tasks. These instructions are written using programming languages."
                    },
                    {
                        heading: "Programming Languages",
                        body: "A programming language allows people to communicate instructions to computers. Examples include C++, Java, Python, and JavaScript."
                    },
                    {
                        heading: "Problem Solving",
                        body: "Before writing a program, understand the problem, identify the required input, determine the process, and decide what output is expected."
                    },
                    {
                        heading: "Key Takeaway",
                        body: "Programming combines logical thinking, planning, and instructions to create useful computer applications."
                    }
                ]
            },
            {
                id: "programming-variables",
                subjectId: "programming",
                title: "Variables and Data Types in C++",
                type: "lesson",
                description: "Understand variables, values, and common C++ data types.",
                duration: "20 min",
                content: [
                    {
                        heading: "What is a Variable?",
                        body: "A variable is a named storage location used to hold information that a program can use or change."
                    },
                    {
                        heading: "Common Data Types",
                        body: "The int type stores whole numbers. The float and double types store decimal numbers. The char type stores a single character, while string stores text."
                    },
                    {
                        heading: "Example",
                        body: "Example: int age = 18; declares an integer variable named age and gives it the value 18."
                    },
                    {
                        heading: "Key Takeaway",
                        body: "Choose a suitable data type based on the kind of information your program needs to store."
                    }
                ]
            },
            {
                id: "database-intro",
                subjectId: "database",
                title: "Introduction to Databases",
                type: "lesson",
                description: "Learn the purpose of databases and how information is organized.",
                duration: "15 min",
                content: [
                    {
                        heading: "What is a Database?",
                        body: "A database is an organized collection of information that can be stored, managed, retrieved, and updated."
                    },
                    {
                        heading: "Tables, Rows, and Columns",
                        body: "A relational database stores information in tables. Rows represent records, while columns represent the attributes or fields of those records."
                    },
                    {
                        heading: "Why Databases Matter",
                        body: "Databases help organizations organize information, reduce unnecessary duplication, and retrieve records efficiently."
                    },
                    {
                        heading: "Key Takeaway",
                        body: "A well-organized database makes information easier to manage and maintain."
                    }
                ]
            },
            {
                id: "database-sql",
                subjectId: "database",
                title: "Basic SQL Commands",
                type: "lesson",
                description: "Explore SELECT, INSERT, UPDATE, and DELETE commands.",
                duration: "20 min",
                content: [
                    {
                        heading: "What is SQL?",
                        body: "SQL stands for Structured Query Language. It is used to communicate with relational database systems."
                    },
                    {
                        heading: "SELECT",
                        body: "SELECT retrieves information from a table. Example: SELECT * FROM students;"
                    },
                    {
                        heading: "INSERT and UPDATE",
                        body: "INSERT adds new records to a table. UPDATE changes existing records. Always use an appropriate WHERE condition when updating specific records."
                    },
                    {
                        heading: "DELETE",
                        body: "DELETE removes records from a table. Use WHERE carefully so you do not accidentally remove more records than intended."
                    }
                ]
            },
            {
                id: "web-html",
                subjectId: "web-development",
                title: "Introduction to HTML",
                type: "lesson",
                description: "Learn how HTML creates the structure of webpages.",
                duration: "15 min",
                content: [
                    {
                        heading: "What is HTML?",
                        body: "HTML stands for HyperText Markup Language. It provides the structure and content of a webpage."
                    },
                    {
                        heading: "HTML Elements",
                        body: "HTML elements commonly use opening and closing tags. Examples include headings, paragraphs, links, images, and lists."
                    },
                    {
                        heading: "Basic Page Structure",
                        body: "A typical HTML document contains a doctype declaration, html element, head section, and body section."
                    },
                    {
                        heading: "Key Takeaway",
                        body: "HTML describes the content and structure of a webpage. CSS and JavaScript can add styling and behavior."
                    }
                ]
            },
            {
                id: "web-css",
                subjectId: "web-development",
                title: "Introduction to CSS",
                type: "lesson",
                description: "Discover how CSS controls the appearance of webpages.",
                duration: "20 min",
                content: [
                    {
                        heading: "What is CSS?",
                        body: "CSS stands for Cascading Style Sheets. It controls how HTML content looks, including colors, spacing, fonts, and layout."
                    },
                    {
                        heading: "CSS Rules",
                        body: "A CSS rule contains a selector and declarations. A declaration contains a property and a value."
                    },
                    {
                        heading: "Selectors",
                        body: "Element selectors target HTML elements. Class selectors begin with a dot, while ID selectors begin with a hash symbol."
                    },
                    {
                        heading: "Key Takeaway",
                        body: "CSS helps make websites readable, organized, attractive, and responsive."
                    }
                ]
            },
            {
                id: "computing-hardware",
                subjectId: "introduction-computing",
                title: "Computer Hardware Components",
                type: "lesson",
                description: "Identify the main physical components of a computer.",
                duration: "15 min",
                content: [
                    {
                        heading: "What is Hardware?",
                        body: "Computer hardware refers to the physical parts of a computer that can be seen and touched."
                    },
                    {
                        heading: "Input Devices",
                        body: "Input devices allow users to provide information to a computer. Examples include keyboards, mice, microphones, and scanners."
                    },
                    {
                        heading: "Processing and Storage",
                        body: "The CPU processes instructions. RAM temporarily stores information in use, while storage devices keep files and programs for longer periods."
                    },
                    {
                        heading: "Output Devices",
                        body: "Output devices present information from a computer. Examples include monitors, printers, and speakers."
                    }
                ]
            },
            {
                id: "computing-software",
                subjectId: "introduction-computing",
                title: "Computer Software and Operating Systems",
                type: "lesson",
                description: "Understand software, applications, and operating systems.",
                duration: "20 min",
                content: [
                    {
                        heading: "What is Software?",
                        body: "Software is a collection of programs and instructions that tell computer hardware what to do."
                    },
                    {
                        heading: "System Software",
                        body: "System software helps operate and manage the computer. Operating systems are an important example."
                    },
                    {
                        heading: "Application Software",
                        body: "Application software helps users perform tasks. Examples include word processors, web browsers, presentation tools, and media players."
                    },
                    {
                        heading: "Key Takeaway",
                        body: "Hardware provides the physical equipment, while software provides the instructions and tools that make it useful."
                    }
                ]
            }
        ];

        const reviewers = [
            {
                id: "programming-reviewer",
                subjectId: "programming",
                title: "C++ Fundamentals Reviewer",
                description: "Quick notes on programming basics, variables, and data types.",
                sections: [
                    {
                        heading: "Programming",
                        points: [
                            "Programming means writing instructions for a computer.",
                            "An algorithm is a step-by-step solution to a problem.",
                            "A program is a set of instructions written in a programming language."
                        ]
                    },
                    {
                        heading: "C++ Data Types",
                        points: [
                            "int – whole numbers",
                            "float – decimal numbers",
                            "double – decimal numbers with greater precision",
                            "char – a single character",
                            "string – text"
                        ]
                    }
                ]
            },
            {
                id: "database-reviewer",
                subjectId: "database",
                title: "Database and SQL Reviewer",
                description: "Review tables, records, fields, and common SQL commands.",
                sections: [
                    {
                        heading: "Database Terms",
                        points: [
                            "Database – organized collection of information.",
                            "Table – organizes related records.",
                            "Row – represents one record.",
                            "Column – represents an attribute or field.",
                            "Primary key – uniquely identifies a record."
                        ]
                    },
                    {
                        heading: "SQL Commands",
                        points: [
                            "SELECT – retrieves records.",
                            "INSERT – adds records.",
                            "UPDATE – modifies records.",
                            "DELETE – removes records."
                        ]
                    }
                ]
            },
            {
                id: "web-reviewer",
                subjectId: "web-development",
                title: "HTML and CSS Reviewer",
                description: "Quick reference for webpage structure and styling.",
                sections: [
                    {
                        heading: "HTML",
                        points: [
                            "HTML means HyperText Markup Language.",
                            "HTML defines webpage structure.",
                            "Headings use h1 through h6.",
                            "Paragraphs use the p element.",
                            "Links use the a element."
                        ]
                    },
                    {
                        heading: "CSS",
                        points: [
                            "CSS means Cascading Style Sheets.",
                            "CSS controls webpage appearance.",
                            "Class selectors begin with a dot.",
                            "ID selectors begin with a hash symbol.",
                            "Responsive CSS helps layouts adapt to screen sizes."
                        ]
                    }
                ]
            },
            {
                id: "computing-reviewer",
                subjectId: "introduction-computing",
                title: "Computer Fundamentals Reviewer",
                description: "Review hardware, software, input, processing, and output.",
                sections: [
                    {
                        heading: "Hardware",
                        points: [
                            "CPU – processes instructions.",
                            "RAM – temporarily stores active information.",
                            "Storage – keeps files and programs.",
                            "Monitor – displays visual output.",
                            "Keyboard – provides text input."
                        ]
                    },
                    {
                        heading: "Software",
                        points: [
                            "System software manages computer operations.",
                            "An operating system manages hardware and software resources.",
                            "Application software helps users perform specific tasks."
                        ]
                    }
                ]
            }
        ];

        function getSubject(subjectId) {
            return subjects.find(subject => subject.id === subjectId);
        }

        function getMaterial(materialId) {
            return learningMaterials.find(item => item.id === materialId);
        }

        function getReviewer(reviewerId) {
            return reviewers.find(item => item.id === reviewerId);
        }


        /* =================================================
           14. LESSON PROGRESS AND RECENT ACTIVITY STORAGE
           ================================================= */

        const LESSON_PROGRESS_KEY = "greyMatterLessonProgress";
        const RECENT_ACTIVITY_KEY = "greyMatterRecentActivity";
        const LAST_LESSON_KEY = "greyMatterLastLesson";
        const STUDY_TIME_KEY = "greyMatterStudyTime";

        function getLessonProgress() {
            return readStorage(LESSON_PROGRESS_KEY, {});
        }

        function saveLessonProgress(progress) {
            return writeStorage(LESSON_PROGRESS_KEY, progress);
        }

        function isLessonComplete(lessonId) {
            return Boolean(getLessonProgress()[lessonId]);
        }

        function setLessonComplete(lessonId, completed) {
            const progress = getLessonProgress();

            if (completed) {
                progress[lessonId] = true;
            } else {
                delete progress[lessonId];
            }

            saveLessonProgress(progress);
        }

        function getRecentActivity() {
            return readStorage(RECENT_ACTIVITY_KEY, []);
        }

        function recordRecentActivity(title, description, type = "learning") {
            const activities = getRecentActivity();

            activities.unshift({
                title,
                description,
                type,
                date: new Date().toISOString()
            });

            writeStorage(RECENT_ACTIVITY_KEY, activities.slice(0, 10));
        }

        function getStudySeconds() {
            return Number(localStorage.getItem(STUDY_TIME_KEY)) || 0;
        }

        function saveStudySeconds(seconds) {
            localStorage.setItem(STUDY_TIME_KEY, String(seconds));
        }

        function formatStudyTime(seconds) {
            const totalMinutes = Math.floor(seconds / 60);
            const hours = Math.floor(totalMinutes / 60);
            const minutes = totalMinutes % 60;

            return `${hours}h ${minutes}m`;
        }

        function getCompletedLessonCount() {
            const progress = getLessonProgress();

            return learningMaterials.filter(
                item => item.type === "lesson" && progress[item.id]
            ).length;
        }


        /* =================================================
           15. STUDY TIME TRACKER
           ================================================= */

        function flushStudyTime() {
            if (!currentStudyStart) return;

            const now = Date.now();
            const elapsed = Math.floor((now - currentStudyStart) / 1000);

            if (elapsed > 0) {
                saveStudySeconds(getStudySeconds() + elapsed);
            }

            currentStudyStart = now;
        }

        function stopStudyTimer() {
            if (studyTimer) {
                clearInterval(studyTimer);
                studyTimer = null;
            }

            flushStudyTime();
            currentStudyStart = null;
            currentLessonId = null;
        }

        function startStudyTimer(lessonId) {
            stopStudyTimer();

            if (document.hidden) return;

            currentLessonId = lessonId;
            currentStudyStart = Date.now();

            studyTimer = setInterval(() => {
                if (document.hidden) {
                    flushStudyTime();
                    return;
                }

                flushStudyTime();
                updateDashboardStats();
            }, 15000);
        }

        document.addEventListener("visibilitychange", () => {
            if (document.hidden) {
                flushStudyTime();
                currentStudyStart = null;
            } else if (currentLessonId) {
                currentStudyStart = Date.now();
            }
        });

        window.addEventListener("pagehide", flushStudyTime);


        /* =================================================
           16. LESSONS AND REVIEWERS OVERVIEW
           ================================================= */
        let lessonStatusFilter = "active";
        
function renderLessonsPage(searchTerm = "") {
    const term = searchTerm.trim().toLowerCase();

    const filteredLessons = learningMaterials.filter(item => {
        const subject = getSubject(item.subjectId);

        const matchesSearch =
            !term ||
            item.title.toLowerCase().includes(term) ||
            item.description.toLowerCase().includes(term) ||
            subject.name.toLowerCase().includes(term);

        const matchesStatus =
            lessonStatusFilter === "completed"
                ? isLessonComplete(item.id)
                : !isLessonComplete(item.id);

        return matchesSearch && matchesStatus;
    });

    const filteredReviewers = reviewers.filter(item => {
        const subject = getSubject(item.subjectId);

        return (
            !term ||
            item.title.toLowerCase().includes(term) ||
            item.description.toLowerCase().includes(term) ||
            subject.name.toLowerCase().includes(term)
        );
    });

    const completed = getCompletedLessonCount();

    return `
        <div class="subjects-portal lessons-page">

            <div class="portal-section">
                <div class="section-heading">
                    <h2>Lessons and Reviewers</h2>
                    <p>Explore your learning materials and review important topics from your subjects.</p>
                </div>

                <div class="study-time-note">
                    <strong>Your learning progress</strong>
                    <p>${completed} of ${learningMaterials.length} lessons completed · ${formatStudyTime(getStudySeconds())} studied</p>
                </div>
            </div>

            <div class="lesson-search-wrap">
                <input
                    type="search"
                    id="lessonSearch"
                    class="lesson-search"
                    placeholder="Search lessons, reviewers, or subjects..."
                    value="${escapeHTML(searchTerm)}"
                    aria-label="Search learning materials"
                >
            </div>

            <div id="lessonSearchResults">

                <div class="lesson-filter-wrap">
                    <button
                        type="button"
                        class="portal-button lesson-filter-button ${lessonStatusFilter === "active" ? "active" : ""}"
                        data-lesson-filter="active"
                        aria-pressed="${lessonStatusFilter === "active"}"
                    >
                        Active
                    </button>

                    <button
                        type="button"
                        class="portal-button lesson-filter-button ${lessonStatusFilter === "completed" ? "active" : ""}"
                        data-lesson-filter="completed"
                        aria-pressed="${lessonStatusFilter === "completed"}"
                    >
                        Completed
                    </button>
                </div>

                <div class="portal-section">
                    <div class="section-heading">
                        <h2>Lessons</h2>
                        <p>
                            ${lessonStatusFilter === "active"
                                ? "Continue studying your unfinished lessons."
                                : "Review lessons you have already completed."}
                        </p>
                    </div>

                    ${filteredLessons.length ? `
                        ${subjects.map(subject => {
                            const items = filteredLessons.filter(
                                item => item.subjectId === subject.id
                            );

                            if (!items.length) return "";

                            return `
                                <div class="lesson-subject-group">
                                    <h3>${escapeHTML(subject.name)}</h3>

                                    <div class="lesson-grid">
                                        ${items.map(item => `
                                            <article class="lesson-card">
                                                <div class="lesson-card-top">
                                                    <span class="lesson-type-badge">LESSON</span>

                                                    <span class="lesson-status-badge ${
                                                        isLessonComplete(item.id) ? "completed" : "pending"
                                                    }">
                                                        ${isLessonComplete(item.id) ? "Completed" : "Not Started"}
                                                    </span>
                                                </div>

                                                <h4>${escapeHTML(item.title)}</h4>
                                                <p>${escapeHTML(item.description)}</p>

                                                <div class="lesson-card-meta">
                                                    <span>◷ ${escapeHTML(item.duration)}</span>
                                                </div>

                                                <div class="lesson-card-actions">
                                                    <button
                                                        type="button"
                                                        class="portal-button"
                                                        data-open-lesson="${escapeHTML(item.id)}"
                                                    >
                                                        Open Lesson
                                                    </button>
                                                </div>
                                            </article>
                                        `).join("")}
                                    </div>
                                </div>
                            `;
                        }).join("")}
                    ` : `
                        <div class="lesson-empty-state">
                            <h3>${
                                term
                                    ? "No matching lessons found"
                                    : lessonStatusFilter === "completed"
                                        ? "No completed lessons yet"
                                        : "All lessons completed!"
                            }</h3>
                            <p>${
                                term
                                    ? "Try a different search term."
                                    : lessonStatusFilter === "completed"
                                        ? "Your completed lessons will appear here."
                                        : "Congratulations! You have completed all available lessons."
                            }</p>
                        </div>
                    `}
                </div>

                <div class="portal-section">
                    <div class="section-heading">
                        <h2>Reviewers</h2>
                        <p>Use these quick notes to review important concepts.</p>
                    </div>

                    ${filteredReviewers.length ? `
                        <div class="reviewer-list">
                            ${filteredReviewers.map(item => {
                                const subject = getSubject(item.subjectId);

                                return `
                                    <article class="reviewer-card">
                                        <span class="lesson-type-badge">REVIEWER</span>

                                        <h3>${escapeHTML(item.title)}</h3>
                                        <p>${escapeHTML(item.description)}</p>

                                        <small>${escapeHTML(subject.name)}</small>

                                        <div class="lesson-card-actions">
                                            <button
                                                type="button"
                                                class="portal-button"
                                                data-open-reviewer="${escapeHTML(item.id)}"
                                            >
                                                Open Reviewer
                                            </button>
                                        </div>
                                    </article>
                                `;
                            }).join("")}
                        </div>
                    ` : `
                        <div class="lesson-empty-state">
                            <h3>No reviewers found</h3>
                            <p>Try a different search term.</p>
                        </div>
                    `}
                </div>

            </div>
        </div>
    `;
}


document.addEventListener("click", event => {
    const settingsLogoutButton =
        event.target.closest("#settingsLogoutButton");

    if (settingsLogoutButton) {
        logout();
        return;
    }
    const filterButton =
        event.target.closest("[data-lesson-filter]");

    if (!filterButton) return;

    const selectedFilter = filterButton.dataset.lessonFilter;

    if (
        selectedFilter !== "active" &&
        selectedFilter !== "completed"
    ) {
        return;
    }

    lessonStatusFilter = selectedFilter;

    const searchInput = document.getElementById("lessonSearch");
    const searchTerm = searchInput ? searchInput.value : "";

    const results =
        document.getElementById("lessonSearchResults");

    if (!results) return;

    const temporary = document.createElement("div");
    temporary.innerHTML = renderLessonsPage(searchTerm);

    const updatedResults =
        temporary.querySelector("#lessonSearchResults");

    if (updatedResults) {
        results.innerHTML = updatedResults.innerHTML;
    }
});



        /* =================================================
           17. INDIVIDUAL LESSON PAGE
           ================================================= */

        function renderLessonDetail(lessonId) {
            const lesson = getMaterial(lessonId);

            if (!lesson) {
                return `
                    <div class="lesson-empty-state">
                        <h3>Lesson not found</h3>
                        <button class="portal-button" data-back-to-lessons>
                            Back to Lessons
                        </button>
                    </div>
                `;
            }

            const subject = getSubject(lesson.subjectId);
            const completed = isLessonComplete(lesson.id);

            return `
                <div class="subjects-portal lesson-detail">

                    <button class="portal-button secondary-button" data-back-to-lessons>
                        ← Back to Lessons
                    </button>

                    <div class="lesson-detail-header">
                        <span class="lesson-type-badge">LESSON</span>
                        <h2>${escapeHTML(lesson.title)}</h2>
                        <p>${escapeHTML(subject.name)} · ${escapeHTML(lesson.duration)}</p>
                        <p>${escapeHTML(lesson.description)}</p>
                    </div>

                    <div class="lesson-content">
                        ${lesson.content.map((section, index) => `
                            <section class="lesson-section">
                                <h3>${index + 1}. ${escapeHTML(section.heading)}</h3>
                                <p>${escapeHTML(section.body)}</p>
                            </section>
                        `).join("")}
                    </div>

                    <div class="lesson-completion-area">
                        <button
                            type="button"
                            class="portal-button lesson-complete-button"
                            data-toggle-lesson-complete="${escapeHTML(lesson.id)}"
                        >
                            ${completed ? "✓ Mark as Incomplete" : "✓ Mark as Complete"}
                        </button>

                        <p class="study-time-note">
                            ${completed
                                ? "You have completed this lesson."
                                : "Finish reading, then mark this lesson as complete."}
                        </p>
                    </div>

                </div>
            `;
        }


        /* =================================================
           18. INDIVIDUAL REVIEWER PAGE
           ================================================= */

        function renderReviewerDetail(reviewerId) {
            const reviewer = getReviewer(reviewerId);

            if (!reviewer) {
                return `
                    <div class="lesson-empty-state">
                        <h3>Reviewer not found</h3>
                        <button class="portal-button" data-back-to-lessons>
                            Back to Lessons
                        </button>
                    </div>
                `;
            }

            const subject = getSubject(reviewer.subjectId);

            return `
                <div class="subjects-portal lesson-detail">

                    <button class="portal-button secondary-button" data-back-to-lessons>
                        ← Back to Reviewers
                    </button>

                    <div class="lesson-detail-header">
                        <span class="lesson-type-badge">REVIEWER</span>
                        <h2>${escapeHTML(reviewer.title)}</h2>
                        <p>${escapeHTML(subject.name)}</p>
                        <p>${escapeHTML(reviewer.description)}</p>
                    </div>

                    <div class="lesson-content">
                        ${reviewer.sections.map((section, index) => `
                            <section class="lesson-section">
                                <h3>${index + 1}. ${escapeHTML(section.heading)}</h3>

                                <ul>
                                    ${section.points.map(point => `
                                        <li>${escapeHTML(point)}</li>
                                    `).join("")}
                                </ul>
                            </section>
                        `).join("")}
                    </div>

                    <p class="study-time-note">
                        Use this reviewer as a quick reference when studying.
                    </p>

                </div>
            `;
        }


        /* =================================================
           19. OPEN AND COMPLETE LESSONS
           ================================================= */

        function openLesson(lessonId) {
            const lesson = getMaterial(lessonId);

            if (!lesson) return;

            stopStudyTimer();

            localStorage.setItem(LAST_LESSON_KEY, lessonId);

            recordRecentActivity(
                "Opened " + lesson.title,
                getSubject(lesson.subjectId).name,
                "lesson"
            );

            dashboardContent.innerHTML = renderLessonDetail(lessonId);

            startStudyTimer(lessonId);

            if (dashboardTitle) {
                dashboardTitle.textContent = "Lesson Details";
            }

            if (dashboardSubtitle) {
                dashboardSubtitle.textContent = lesson.title;
            }
        }

        function toggleLessonComplete(lessonId) {
            const lesson = getMaterial(lessonId);

            if (!lesson) return;

            const completed = !isLessonComplete(lessonId);

            setLessonComplete(lessonId, completed);

            recordRecentActivity(
                completed
                    ? "Completed " + lesson.title
                    : "Reopened " + lesson.title,
                getSubject(lesson.subjectId).name,
                "lesson"
            );

            dashboardContent.innerHTML = renderLessonDetail(lessonId);

            updateDashboardStats();
        }


        /* =================================================
           20. DASHBOARD STATISTICS
           ================================================= */

        function updateDashboardStats() {
            const totalLessons = learningMaterials.length;
            const completedLessons = getCompletedLessonCount();

            const progress = totalLessons
                ? Math.round((completedLessons / totalLessons) * 100)
                : 0;

            const statSubjects = document.getElementById("statSubjects");
            const statLessons = document.getElementById("statLessons");
            const statStudyHours = document.getElementById("statStudyHours");
            const statProgress = document.getElementById("statProgress");
            const progressFill = document.getElementById("overallProgressFill");
            const lessonDescription = document.getElementById("statLessonsDescription");

            if (statSubjects) {
                statSubjects.textContent = String(subjects.length).padStart(2, "0");
            }

            if (statLessons) {
                statLessons.textContent =
                    String(completedLessons).padStart(2, "0");
            }

            if (statStudyHours) {
                statStudyHours.textContent =
                    formatStudyTime(getStudySeconds());
            }

            if (statProgress) {
                statProgress.textContent = progress + "%";
            }

            if (progressFill) {
                progressFill.style.width = progress + "%";
            }

            if (lessonDescription) {
                lessonDescription.textContent =
                    `${completedLessons} of ${totalLessons} lessons completed`;
            }

            renderDashboardSubjects();
            renderDashboardRecentActivity();
        }

        function renderDashboardSubjects() {
            const container =
                document.getElementById("dashboardSubjectsList");

            if (!container) return;

            container.innerHTML = subjects.map(subject => `
                <article class="dashboard-subject-item">
                    <div>
                        <strong>${escapeHTML(subject.name)}</strong>
                        <p>${escapeHTML(subject.description)}</p>
                    </div>

                    <button
                        type="button"
                        class="portal-button"
                        data-open-subject="${escapeHTML(subject.id)}"
                    >
                        View
                    </button>
                </article>
            `).join("");
        }

        function renderDashboardRecentActivity() {
            const container =
                document.getElementById("dashboardRecentActivity");

            if (!container) return;

            const activities = getRecentActivity();

            if (!activities.length) {
                container.innerHTML = `
                    <div class="portal-empty-state">
                        <p>Your learning and submission activities will appear here.</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = activities.slice(0, 5).map(item => `
                <article class="dashboard-activity-item">
                    <div>
                        <strong>${escapeHTML(item.title)}</strong>
                        <p>${escapeHTML(item.description)}</p>
                        <small>${escapeHTML(formatDate(item.date))}</small>
                    </div>
                </article>
            `).join("");
        }

        function openContinueLearning() {
            const lastLesson = localStorage.getItem(LAST_LESSON_KEY);

            if (lastLesson && getMaterial(lastLesson)) {
                openLesson(lastLesson);
            } else {
                showSection("lessons");
            }
        }


        /* =================================================
           21. SUBMISSION DATA STORAGE
           ================================================= */

        function getSubmissions() {
            return readStorage("greyMatterSubmissions", {});
        }

        function saveSubmissions(submissions) {
            writeStorage("greyMatterSubmissions", submissions);
        }

        function getSubmission(activityId) {
            return getSubmissions()[activityId] || null;
        }

        function getAllActivities() {
            return subjects.flatMap(subject =>
                subject.activities.map(activity => ({
                    ...activity,
                    subjectId: subject.id,
                    subjectName: subject.name
                }))
            );
        }

        function getActivity(activityId) {
            return getAllActivities().find(
                activity => activity.id === activityId
            );
        }

        function isBeforeDeadline(activityId) {
            const activity = getActivity(activityId);

            return Boolean(
                activity &&
                activity.deadlineAt &&
                new Date() < new Date(activity.deadlineAt)
            );
        }


        /* =================================================
           22. INDEXEDDB FILE STORAGE
           ================================================= */

        const DB_NAME = "GreyMatterStudyHub";
        const DB_VERSION = 2;
        const STORE_NAME = "attachments";
        const PROFILE_PICTURE_STORE = "profilePictures";

        function openAttachmentDatabase() {
    return new Promise((resolve, reject) => {
        if (!window.indexedDB) {
            reject(new Error("IndexedDB is not supported."));
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = () => {
            const database = request.result;

            // Preserve existing activity attachments
            if (!database.objectStoreNames.contains(STORE_NAME)) {
                database.createObjectStore(STORE_NAME);
            }

            // Create separate storage for profile pictures
            if (!database.objectStoreNames.contains(PROFILE_PICTURE_STORE)) {
                database.createObjectStore(PROFILE_PICTURE_STORE);
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

        async function saveAttachment(activityId, file) {
            const database = await openAttachmentDatabase();

            return new Promise((resolve, reject) => {
                const transaction =
                    database.transaction(STORE_NAME, "readwrite");

                const request =
                    transaction.objectStore(STORE_NAME).put(file, activityId);

                request.onsuccess = () => resolve(true);
                request.onerror = () => reject(request.error);

                transaction.oncomplete = () => database.close();
                transaction.onerror = () => database.close();
            });
        }

        async function getAttachment(activityId) {
            const database = await openAttachmentDatabase();

            return new Promise((resolve, reject) => {
                const transaction =
                    database.transaction(STORE_NAME, "readonly");

                const request =
                    transaction.objectStore(STORE_NAME).get(activityId);

                request.onsuccess = () => resolve(request.result || null);
                request.onerror = () => reject(request.error);

                transaction.oncomplete = () => database.close();
                transaction.onerror = () => database.close();
            });
        }

        async function deleteAttachment(activityId) {
            const database = await openAttachmentDatabase();

            return new Promise((resolve, reject) => {
                const transaction =
                    database.transaction(STORE_NAME, "readwrite");

                transaction.objectStore(STORE_NAME).delete(activityId);

                transaction.oncomplete = () => {
                    database.close();
                    resolve(true);
                };

                transaction.onerror = () => {
                    database.close();
                    reject(transaction.error);
                };
            });
        }
    
        // ==========================================
// PROFILE PICTURE STORAGE
// ==========================================

async function saveProfilePicture(file) {
    const database = await openAttachmentDatabase();

    return new Promise((resolve, reject) => {
        const transaction = database.transaction(
            PROFILE_PICTURE_STORE,
            "readwrite"
        );

        transaction.objectStore(PROFILE_PICTURE_STORE).put(
            file,
            "studentProfilePicture"
        );

        transaction.oncomplete = () => {
            database.close();
            resolve(true);
        };

        transaction.onerror = () => {
            database.close();
            reject(transaction.error);
        };
    });
}

async function getProfilePicture() {
    const database = await openAttachmentDatabase();

    return new Promise((resolve, reject) => {
        const transaction = database.transaction(
            PROFILE_PICTURE_STORE,
            "readonly"
        );

        const request = transaction
            .objectStore(PROFILE_PICTURE_STORE)
            .get("studentProfilePicture");

        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);

        transaction.oncomplete = () => database.close();
        transaction.onerror = () => database.close();
    });
}

async function deleteProfilePicture() {
    const database = await openAttachmentDatabase();

    return new Promise((resolve, reject) => {
        const transaction = database.transaction(
            PROFILE_PICTURE_STORE,
            "readwrite"
        );

        transaction.objectStore(PROFILE_PICTURE_STORE)
            .delete("studentProfilePicture");

        transaction.oncomplete = () => {
            database.close();
            resolve(true);
        };

        transaction.onerror = () => {
            database.close();
            reject(transaction.error);
        };
    });
}


        /* =================================================
           23. SUBJECTS OVERVIEW
           ================================================= */

        function renderSubjectOverview() {
            const announcements = subjects.flatMap(subject =>
                subject.announcements.map(item => ({
                    ...item,
                    subjectName: subject.name
                }))
            );

            const pendingActivities = getAllActivities().filter(
                activity => !getSubmission(activity.id)
            );

            return `
                <div class="subjects-portal">

                    <div class="portal-section">
                        <div class="section-heading">
                            <h2>Subjects Overview</h2>
                            <p>Welcome to your learning space. Access your subjects and activities here.</p>
                        </div>
                    </div>

                    <div class="portal-section">
                        <div class="section-heading">
                            <h2>Announcements</h2>
                            <p><strong>Sample / Demo Content:</strong> These are example announcements.</p>
                        </div>

                        <div class="announcement-list">
                            ${announcements.map(item => `
                                <article class="announcement-card">
                                    <div class="announcement-content">
                                        <span class="sample-label">SAMPLE</span>
                                        <h3>${escapeHTML(item.title)}</h3>
                                        <p>${escapeHTML(item.message)}</p>
                                        <small>${escapeHTML(item.subjectName)} · ${escapeHTML(item.date)}</small>
                                    </div>
                                </article>
                            `).join("")}
                        </div>
                    </div>

                    <div class="portal-section">
                        <div class="section-heading">
                            <h2>Pending Activities</h2>
                            <p>Activities that still need your submission.</p>
                        </div>

                        ${pendingActivities.length ? `
                            <div class="activity-list">
                                ${pendingActivities.map(activity => `
                                    <article class="activity-card">
                                        <div>
                                            <h3>${escapeHTML(activity.title)}</h3>
                                            <p>${escapeHTML(activity.subjectName)}</p>
                                            <span class="status-badge pending">Pending</span>
                                        </div>

                                        <button class="portal-button" data-open-activity="${escapeHTML(activity.id)}">
                                            View Activity
                                        </button>
                                    </article>
                                `).join("")}
                            </div>
                        ` : `
                            <div class="portal-empty-state">
                                <h3>All activities submitted!</h3>
                                <p>You have no pending activities.</p>
                            </div>
                        `}
                    </div>

                    <div class="portal-section">
                        <div class="section-heading">
                            <h2>My Subjects</h2>
                            <p>Select a subject to view its activities.</p>
                        </div>

                        <div class="subject-grid">
                            ${subjects.map(subject => `
                                <button type="button" class="subject-card" data-open-subject="${escapeHTML(subject.id)}">
                                    <span class="subject-code">${escapeHTML(subject.code)}</span>
                                    <h3>${escapeHTML(subject.name)}</h3>
                                    <p>${escapeHTML(subject.description)}</p>
                                    <span class="subject-card-link">View Subject →</span>
                                </button>
                            `).join("")}
                        </div>
                    </div>

                    <div class="portal-section">
                        <div class="section-heading">
                            <h2>Submission History</h2>
                            <p>Your previously submitted activities.</p>
                        </div>

                        ${renderSubmissionHistory()}
                    </div>

                </div>
            `;
        }


        /* =================================================
           24. SUBMISSION HISTORY
           ================================================= */

        function renderSubmissionHistory(subjectId = null) {
            const history = Object.entries(getSubmissions())
                .map(([activityId, submission]) => ({
                    activityId,
                    ...submission,
                    activity: getActivity(activityId)
                }))
                .filter(item => item.activity)
                .filter(item =>
                    !subjectId || item.activity.subjectId === subjectId
                )
                .sort((a, b) =>
                    new Date(b.submittedAt) - new Date(a.submittedAt)
                );

            if (!history.length) {
                return `
                    <div class="portal-empty-state">
                        <h3>No submissions yet</h3>
                        <p>Your submitted activities will appear here.</p>
                    </div>
                `;
            }

            return `
                <div class="submission-history">
                    ${history.map(item => `
                        <article class="history-card">
                            <div>
                                <h3>${escapeHTML(item.activity.title)}</h3>
                                <p>${escapeHTML(item.activity.subjectName)}</p>
                                <small>Submitted: ${escapeHTML(formatDate(item.submittedAt))}</small>
                            </div>

                            <span class="status-badge submitted">Submitted</span>
                        </article>
                    `).join("")}
                </div>
            `;
        }


        /* =================================================
           25. INDIVIDUAL SUBJECT PAGE
           ================================================= */

        function renderSubjectPage(subjectId) {
            const subject = getSubject(subjectId);

            if (!subject) {
                return `
                    <div class="portal-empty-state">
                        <h3>Subject not found</h3>
                        <button class="portal-button" data-section="subjects">
                            Back to Subjects
                        </button>
                    </div>
                `;
            }

            currentSubjectId = subjectId;

            return `
                <div class="subjects-portal">

                    <button class="portal-button secondary-button" data-section="subjects">
                        ← Back to Subjects
                    </button>

                    <div class="subject-detail-header">
                        <span class="subject-code">${escapeHTML(subject.code)}</span>
                        <h2>${escapeHTML(subject.name)}</h2>
                        <p>${escapeHTML(subject.description)}</p>
                    </div>

                    <div class="portal-section">
                        <div class="section-heading">
                            <h2>Subject Announcements</h2>
                            <p><strong>Sample / Demo Content:</strong> These are example announcements.</p>
                        </div>

                        <div class="announcement-list">
                            ${subject.announcements.map(item => `
                                <article class="announcement-card">
                                    <div>
                                        <span class="sample-label">SAMPLE</span>
                                        <h3>${escapeHTML(item.title)}</h3>
                                        <p>${escapeHTML(item.message)}</p>
                                        <small>${escapeHTML(item.date)}</small>
                                    </div>
                                </article>
                            `).join("")}
                        </div>
                    </div>

                    <div class="portal-section">
                        <div class="section-heading">
                            <h2>Activities</h2>
                            <p>View and complete your subject activities.</p>
                        </div>

                        <div class="activity-list">
                            ${subject.activities.map(activity => {
                                const submitted = getSubmission(activity.id);

                                return `
                                    <article class="activity-card">
                                        <div>
                                            <h3>${escapeHTML(activity.title)}</h3>
                                            <p>${escapeHTML(activity.description)}</p>
                                            <span class="status-badge ${submitted ? "submitted" : "pending"}">
                                                ${submitted ? "Submitted" : "Pending"}
                                            </span>
                                        </div>

                                        <button class="portal-button" data-open-activity="${escapeHTML(activity.id)}">
                                            View Activity
                                        </button>
                                    </article>
                                `;
                            }).join("")}
                        </div>
                    </div>

                    <div class="portal-section">
                        <div class="section-heading">
                            <h2>Submission History</h2>
                            <p>Your submissions for this subject.</p>
                        </div>

                        ${renderSubmissionHistory(subjectId)}
                    </div>

                </div>
            `;
        }


        /* =================================================
           26. ACTIVITY OVERVIEW
           ================================================= */

        function renderActivityOverview() {
            const activities = getAllActivities();

            return `
                <div class="subjects-portal">
                    <div class="portal-section">
                        <div class="section-heading">
                            <h2>All Activities</h2>
                            <p>View your activities from all subjects.</p>
                        </div>

                        <div class="activity-list">
                            ${activities.map(activity => {
                                const submitted = getSubmission(activity.id);

                                return `
                                    <article class="activity-card">
                                        <div>
                                            <h3>${escapeHTML(activity.title)}</h3>
                                            <p>${escapeHTML(activity.subjectName)}</p>
                                            <span class="status-badge ${submitted ? "submitted" : "pending"}">
                                                ${submitted ? "Submitted" : "Pending"}
                                            </span>
                                        </div>

                                        <button class="portal-button" data-open-activity="${escapeHTML(activity.id)}">
                                            View Activity
                                        </button>
                                    </article>
                                `;
                            }).join("")}
                        </div>
                    </div>

                    <div class="portal-section">
                        <div class="section-heading">
                            <h2>Submission History</h2>
                            <p>Review your submitted work.</p>
                        </div>

                        ${renderSubmissionHistory()}
                    </div>
                </div>
            `;
        }


        /* =================================================
           27. ACTIVITY DETAIL PAGE
           ================================================= */

        function renderActivityDetail(activityId) {
            const activity = getActivity(activityId);

            if (!activity) {
                return `
                    <div class="portal-empty-state">
                        <h3>Activity not found</h3>
                        <button class="portal-button" data-section="subjects">
                            Back to Subjects
                        </button>
                    </div>
                `;
            }

            currentActivityId = activityId;

            const submission = getSubmission(activityId);

            return `
                <div class="subjects-portal">

                    <button class="portal-button secondary-button" data-section="subjects">
                        ← Back to Subjects
                    </button>

                    <div class="activity-detail">
                        <div class="activity-detail-header">
                            <span class="status-badge ${submission ? "submitted" : "pending"}">
                                ${submission ? "Submitted" : "Pending"}
                            </span>

                            <h2>${escapeHTML(activity.title)}</h2>
                            <p>Subject: ${escapeHTML(activity.subjectName)}</p>
                            <p>${escapeHTML(activity.description)}</p>
                        </div>

                        <div class="activity-instructions">
                            <h3>Instructions</h3>
                            <p>${escapeHTML(activity.instructions)}</p>
                            <p class="activity-deadline">${escapeHTML(activity.deadline)}</p>
                        </div>

                        ${submission
                            ? renderSubmittedWork(activityId, submission)
                            : renderSubmissionForm(activityId)
                        }
                    </div>
                </div>
            `;
        }


        /* =================================================
           28. SUBMISSION FORM
           ================================================= */

        function renderSubmissionForm(activityId) {
            return `
                <form id="submissionForm" data-activity-id="${escapeHTML(activityId)}" class="submission-form">
                    <h3>Submit Your Work</h3>

                    <div class="form-group">
                        <label for="submissionAnswer">Your Answer</label>
                        <textarea
                            id="submissionAnswer"
                            name="answer"
                            rows="7"
                            placeholder="Type your answer here..."
                        ></textarea>
                    </div>

                    <div class="form-group">
                        <label for="submissionFile">Attach a File (Optional)</label>
                        <input
                            type="file"
                            id="submissionFile"
                            name="attachment"
                            accept=".cpp,.h,.sql,.html,.css,.js,.txt,.pdf,.doc,.docx,.ppt,.pptx,.zip"
                        >
                        <small class="file-note">
                            Accepted formats: CPP, H, SQL, HTML, CSS, JS, TXT, PDF, DOC, DOCX, PPT, PPTX, ZIP.
                            Maximum file size: 10 MB.
                        </small>
                    </div>

                    <p id="submissionMessage" class="form-message"></p>

                    <button type="submit" class="portal-button">
                        Submit Activity
                    </button>
                </form>
            `;
        }


        /* =================================================
           29. DISPLAY SUBMITTED WORK
           ================================================= */

        function renderSubmittedWork(activityId, submission) {
            return `
                <div class="submitted-work">
                    <h3>Your Submitted Work</h3>
                    <span class="status-badge submitted">Submitted</span>

                    <p>Submitted on: ${escapeHTML(formatDate(submission.submittedAt))}</p>

                    ${submission.answer ? `
                        <div class="submitted-answer">
                            <h4>Your Answer</h4>
                            <p>${escapeHTML(submission.answer)}</p>
                        </div>
                    ` : ""}

                    ${submission.fileName ? `
                        <div class="attachment-row">
                            <div>
                                <strong>${escapeHTML(submission.fileName)}</strong>
                                <small>${escapeHTML(formatFileSize(submission.fileSize))}</small>
                            </div>

                            <button type="button" class="portal-button" data-download-attachment="${escapeHTML(activityId)}">
                                Download File
                            </button>
                        </div>
                    ` : ""}

                    <p class="submission-note">Your submission is saved on this browser.</p>

                    ${isBeforeDeadline(activityId) ? `
                        <button
                            type="button"
                            class="portal-button secondary-button"
                            data-unsubmit-activity="${escapeHTML(activityId)}"
                        >
                            Unsubmit Activity
                        </button>
                    ` : `
                        <p class="submission-note">The deadline has passed. Unsubmitting is no longer available.</p>
                    `}
                </div>
            `;
        }


        /* =================================================
           30. HANDLE ACTIVITY SUBMISSION
           ================================================= */

        async function handleSubmission(form) {
            const activityId = form.dataset.activityId;

            const answer =
                document.getElementById("submissionAnswer").value.trim();

            const fileInput =
                document.getElementById("submissionFile");

            const file = fileInput.files.length ? fileInput.files[0] : null;

            const message =
                document.getElementById("submissionMessage");

            if (!answer && !file) {
                message.textContent =
                    "Please type an answer or attach a file.";
                return;
            }

            if (file) {
                const extension =
                    file.name.split(".").pop().toLowerCase();

                if (!allowedExtensions.includes(extension)) {
                    message.textContent = "This file format is not allowed.";
                    return;
                }

                if (file.size > MAX_FILE_SIZE) {
                    message.textContent = "The file exceeds the 10 MB limit.";
                    return;
                }
            }

            try {
                if (file) {
                    await saveAttachment(activityId, file);
                }

                const submissions = getSubmissions();

                submissions[activityId] = {
                    answer,
                    fileName: file ? file.name : "",
                    fileSize: file ? file.size : 0,
                    fileType: file ? file.type : "",
                    submittedAt: new Date().toISOString()
                };

                saveSubmissions(submissions);

                const activity = getActivity(activityId);

                recordRecentActivity(
                    "Submitted " + activity.title,
                    activity.subjectName,
                    "submission"
                );

                showSection("activity");
                dashboardContent.innerHTML =
                    renderActivityDetail(activityId);

                if (dashboardSubtitle) {
                    dashboardSubtitle.textContent =
                        "Review your submitted activity.";
                }

            } catch (error) {
                console.error("Submission error:", error);
                message.textContent =
                    "Unable to save your submission. Please try again.";
            }
        }


        /* =================================================
           31. DOWNLOAD ATTACHMENT
           ================================================= */

        async function downloadAttachment(activityId) {
            try {
                const file = await getAttachment(activityId);

                if (!file) {
                    alert("The attachment could not be found.");
                    return;
                }

                const url = URL.createObjectURL(file);
                const link = document.createElement("a");

                link.href = url;
                link.download = file.name || "submission-file";

                document.body.appendChild(link);
                link.click();
                link.remove();

                setTimeout(() => URL.revokeObjectURL(url), 1000);

            } catch (error) {
                console.error("Download error:", error);
                alert("Unable to download this attachment.");
            }
        }


        /* =================================================
           32. UNSUBMIT ACTIVITY
           ================================================= */

        async function unsubmitActivity(activityId) {
            const activity = getActivity(activityId);
            const submission = getSubmission(activityId);

            if (!activity || !submission) {
                alert("No submission was found for this activity.");
                return;
            }

            if (!isBeforeDeadline(activityId)) {
                alert("The deadline has passed. You can no longer unsubmit this activity.");
                return;
            }

            const confirmed = confirm(
                "Are you sure you want to unsubmit this activity?\n\n" +
                "Your current answer and attached file will be deleted."
            );

            if (!confirmed) return;

            try {
                if (submission.fileName) {
                    await deleteAttachment(activityId);
                }

                const submissions = getSubmissions();
                delete submissions[activityId];
                saveSubmissions(submissions);

                recordRecentActivity(
                    "Unsubmitted " + activity.title,
                    activity.subjectName,
                    "submission"
                );

                dashboardContent.innerHTML =
                    renderActivityDetail(activityId);

                if (dashboardTitle) {
                    dashboardTitle.textContent = "Activity Details";
                }

                if (dashboardSubtitle) {
                    dashboardSubtitle.textContent =
                        "Your activity is now pending.";
                }

                alert("Activity successfully unsubmitted. You can submit again.");

            } catch (error) {
                console.error("Unsubmit error:", error);
                alert("Unable to unsubmit this activity. Please try again.");
            }
        }


        /* =================================================
           33. PROFILE MANAGEMENT
           ================================================= */

        function setupProfile() {
            const form = document.getElementById("profileForm");
            if (!form) return;

            const user = getSavedUser();

            const fullname = document.getElementById("profileFullname");
            const email = document.getElementById("profileEmail");
            const course = document.getElementById("profileCourse");
            const studentNumber = document.getElementById("profileStudentNumber");
            const editButton = document.getElementById("editProfileButton");
            const message = document.getElementById("profileMessage");

            fullname.value = user.fullname || "";
            email.value = user.email || "";
            course.value = user.course || "";
            studentNumber.value = user.studentNumber || "";

            let editing = false;

            editButton.addEventListener("click", () => {
                if (!editing) {
                    editing = true;

                    fullname.disabled = false;
                    course.disabled = false;
                    studentNumber.disabled = false;

                    editButton.textContent = "Save Changes";
                    message.textContent = "";

                } else {
                    if (!fullname.value.trim()) {
                        message.textContent = "Full name cannot be empty.";
                        return;
                    }

                    user.fullname = fullname.value.trim();
                    user.course = course.value.trim();
                    user.studentNumber = studentNumber.value.trim();

                    saveUser(user);

                    fullname.disabled = true;
                    course.disabled = true;
                    studentNumber.disabled = true;

                    editing = false;

                    editButton.textContent = "Edit Profile";
                    message.textContent = "Profile updated successfully.";

                    updateProfileBadge();
                }
            });
        }


        /* =================================================
           34. NAVIGATION
           ================================================= */

        function showSection(section) {
            stopStudyTimer();

            if (!titles[section]) return;

            if (dashboardTitle) {
                dashboardTitle.textContent = titles[section];
            }

            if (dashboardSubtitle) {
                dashboardSubtitle.textContent = "";
            }

            if (section === "dashboard") {
                dashboardContent.innerHTML = homeContent;
                updateProfileBadge();
                updateDashboardStats();

            } else if (section === "subjects") {
                dashboardContent.innerHTML = renderSubjectOverview();

            } else if (section === "activity") {
                dashboardContent.innerHTML = renderActivityOverview();

            } else if (section === "settings") {
                dashboardContent.innerHTML = renderSettings();
                updateThemeButton();

            } else if (section === "lessons") {
                dashboardContent.innerHTML = renderLessonsPage();

            } else {
                dashboardContent.innerHTML = sections[section] || "";
            }

            if (section === "profile") {
                setupProfile();
            }

            document.querySelectorAll("[data-section]").forEach(button => {
                button.classList.toggle(
                    "active",
                    button.dataset.section === section
                );
            });
        }


        /* =================================================
           35. SEARCH EVENTS
           ================================================= */

        document.addEventListener("input", event => {
            if (event.target.id !== "lessonSearch") return;

            const search = event.target.value;
            const cursorPosition = event.target.selectionStart;

            const results = document.getElementById("lessonSearchResults");

            if (!results) return;

            const temporary = document.createElement("div");
            temporary.innerHTML = renderLessonsPage(search);

            const updatedResults =
                temporary.querySelector("#lessonSearchResults");

            if (updatedResults) {
                results.innerHTML = updatedResults.innerHTML;
            }

            const updatedSearch =
                document.getElementById("lessonSearch");

            if (updatedSearch) {
                updatedSearch.focus();
                updatedSearch.setSelectionRange(cursorPosition, cursorPosition);
            }
        });


        /* =================================================
           36. NAVIGATION AND PORTAL CLICK EVENTS
           ================================================= */

        document.addEventListener("click", event => {

            const continueButton =
                event.target.closest("#continueLearningButton");

            if (continueButton) {
                event.preventDefault();
                openContinueLearning();
                return;
            }

            const sectionButton =
                event.target.closest("[data-section]");

            if (sectionButton) {
                event.preventDefault();
                showSection(sectionButton.dataset.section);
                return;
            }

            const openLessonButton =
                event.target.closest("[data-open-lesson]");

            if (openLessonButton) {
                openLesson(openLessonButton.dataset.openLesson);
                return;
            }

            const openReviewerButton =
                event.target.closest("[data-open-reviewer]");

            if (openReviewerButton) {
                stopStudyTimer();

                const reviewerId =
                    openReviewerButton.dataset.openReviewer;

                dashboardContent.innerHTML =
                    renderReviewerDetail(reviewerId);

                if (dashboardTitle) {
                    dashboardTitle.textContent = "Reviewer";
                }

                const reviewer = getReviewer(reviewerId);

                if (reviewer) {
                    recordRecentActivity(
                        "Opened " + reviewer.title,
                        getSubject(reviewer.subjectId).name,
                        "reviewer"
                    );
                }

                return;
            }

            const completeButton =
                event.target.closest("[data-toggle-lesson-complete]");

            if (completeButton) {
                toggleLessonComplete(
                    completeButton.dataset.toggleLessonComplete
                );
                return;
            }

            const backButton =
                event.target.closest("[data-back-to-lessons]");

            if (backButton) {
                stopStudyTimer();
                showSection("lessons");
                return;
            }

            const subjectButton =
                event.target.closest("[data-open-subject]");

            if (subjectButton) {
                stopStudyTimer();

                dashboardContent.innerHTML =
                    renderSubjectPage(subjectButton.dataset.openSubject);

                if (dashboardTitle) {
                    dashboardTitle.textContent = "Subjects";
                }

                return;
            }

            const activityButton =
                event.target.closest("[data-open-activity]");

            if (activityButton) {
                stopStudyTimer();

                dashboardContent.innerHTML =
                    renderActivityDetail(activityButton.dataset.openActivity);

                if (dashboardTitle) {
                    dashboardTitle.textContent = "Activity Details";
                }

                return;
            }

            const downloadButton =
                event.target.closest("[data-download-attachment]");

            if (downloadButton) {
                downloadAttachment(
                    downloadButton.dataset.downloadAttachment
                );
                return;
            }

            const unsubmitButton =
                event.target.closest("[data-unsubmit-activity]");

            if (unsubmitButton) {
                unsubmitActivity(
                    unsubmitButton.dataset.unsubmitActivity
                );
                return;
            }

            const themeButton =
                event.target.closest("#themeToggle");

            if (themeButton) {
                const currentTheme =
                    document.documentElement.getAttribute("data-theme");

                applyTheme(
                    currentTheme === "dark" ? "light" : "dark"
                );
            }
        });


        /* =================================================
           37. NOTIFICATION PREFERENCE EVENTS
           ================================================= */

        document.addEventListener("change", event => {
            const input =
                event.target.closest("[data-notification-setting]");

            if (!input) return;

            const settingName = input.dataset.notificationSetting;

            const allowedSettings = [
                "activityReminders",
                "announcementNotifications"
            ];

            if (!allowedSettings.includes(settingName)) return;

            const preferences = getNotificationPreferences();
            preferences[settingName] = input.checked;

            const saved = saveNotificationPreferences(preferences);

            const message =
                document.getElementById("notificationPreferenceMessage");

            if (message) {
                message.textContent = saved
                    ? "Your preferences have been saved."
                    : "Unable to save your preferences. Please try again.";
            }
        });


        /* =================================================
           38. SUBMISSION FORM EVENT
           ================================================= */

        document.addEventListener("submit", event => {
            if (event.target.id === "submissionForm") {
                event.preventDefault();
                handleSubmission(event.target);
            }
        });


        /* =================================================
           39. SIDEBAR COLLAPSE
           ================================================= */

        const sidebar = document.getElementById("sidebar");
        const sidebarToggle = document.getElementById("sidebarToggle");

        if (sidebar && sidebarToggle) {
            sidebarToggle.addEventListener("click", () => {
                sidebar.classList.toggle("collapsed");

                const icon =
                    sidebarToggle.querySelector(".toggle-icon");

                const label =
                    sidebarToggle.querySelector(".toggle-label");

                if (icon) {
                    icon.textContent =
                        sidebar.classList.contains("collapsed") ? "☰" : "✕";
                }

                if (label) {
                    label.textContent =
                        sidebar.classList.contains("collapsed")
                            ? "Expand"
                            : "Collapse";
                }
            });
        }


        /* =================================================
           40. LOGOUT
           ================================================= */

        function logout() {
            stopStudyTimer();
            sessionStorage.removeItem("loggedIn");
            window.location.href = "index.html";
        }

        const logoutButton =
            document.getElementById("logoutButton");
        
        


        /* =================================================
           41. INITIALIZE DASHBOARD
           ================================================= */

        const savedTheme =
            localStorage.getItem("greyMatterTheme") || "dark";

        applyTheme(savedTheme);
        updateProfileBadge();
        loadProfilePicture();
        updateDateTime();
        updateDashboardStats();

        setInterval(updateDateTime, 1000);

    }
}
/* ==========================================
   42. PASSWORD VISIBILITY TOGGLE
========================================== */

document.addEventListener("click", function(event) {

    const toggleButton = event.target.closest("[data-password-toggle]");

    if (!toggleButton) return;

    const inputId = toggleButton.getAttribute("aria-controls");
    const passwordInput = document.getElementById(inputId);

    if (!passwordInput) return;

    const isPasswordHidden = passwordInput.type === "password";

    passwordInput.type = isPasswordHidden ? "text" : "password";

    toggleButton.setAttribute(
        "aria-pressed",
        String(isPasswordHidden)
    );

    toggleButton.setAttribute(
        "aria-label",
        isPasswordHidden ? "Hide password" : "Show password"
    );

});
