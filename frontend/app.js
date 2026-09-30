const chatForm =
    document.getElementById("chatForm");

const messageInput =
    document.getElementById("messageInput");

const chatContainer =
    document.getElementById("chatContainer");

const sendButton =
    document.getElementById("sendButton");

const newChatButton =
    document.getElementById("newChatButton");

const chatList =
    document.getElementById("chatList");

const emptyState =
    document.getElementById("emptyState");

const openSidebarButton =
    document.getElementById("openSidebarButton");

const closeSidebarButton =
    document.getElementById("closeSidebarButton");

const sidebar =
    document.getElementById("sidebar");

const resumeInput =
    document.getElementById("resumeInput");


resumeInput.addEventListener(
    "change",
    async function () {

        const file =
            this.files[0];


        if (!file) {
            return;
        }
		showResumeProgress();

updateResumeProgress(
    10,
    "Uploading resume..."
);



        const formData =
            new FormData();


        formData.append(
            "resume",
            file
        );


        try {

            const response =
                await fetch(
                    "http://localhost:3000/api/resume/upload",
                    {
                        method: "POST",

                        body: formData
                    }
                );


            const data =
                await response.json();
updateResumeProgress(
    35,
    "Resume uploaded. Extracting text..."
);

console.log(
    "Resume extracted"
);

            if (!response.ok) {

                throw new Error(
                    data.error ||
                    "Resume upload failed."
                );

            }


           console.log(
				"Resume profile:",
				data.profile
			);
			updateResumeProgress(
    55,
    "Resume analyzed by local AI..."
);
			displayResumeProfile(
				data.profile
			);


updateResumeProgress(
    65,
    "Finding matching jobs..."
);

searchMatchingJobs(
    data.profile
);


searchMatchingJobs(
    data.profile
);


        } catch (error) {

            console.error(
                "Resume upload error:",
                error
            );


            alert(
                error.message
            );

        }


        this.value = "";

    }
);

function displayResumeProfile(profile) {

    let existing =
        document.getElementById(
            "resumeProfile"
        );


    if (!existing) {

        existing =
            document.createElement(
                "div"
            );

        existing.id =
            "resumeProfile";

        existing.className =
            "resume-profile";


        const resumePanel =
            document.querySelector(
                ".resume-panel"
            );


        resumePanel.insertAdjacentElement(
            "afterend",
            existing
        );

    }


    existing.innerHTML = `

        <div class="resume-profile-header">

            <div>

                <strong>
                    Resume Profile
                </strong>

                <span>
                    Extracted by local AI
                </span>

            </div>

        </div>


        <div class="resume-profile-grid">

            ${profileSection(
                "Target Roles",
                profile.target_roles
            )}

            ${profileSection(
                "Skills",
                profile.skills
            )}

            ${profileSection(
                "Tools & Technologies",
                profile.tools_and_technologies
            )}

            ${profileSection(
                "Education",
                profile.education
            )}

            ${profileSection(
                "Certifications",
                profile.certifications
            )}

            ${profileSection(
                "Industries",
                profile.industries
            )}

            ${profileSection(
                "Locations",
                profile.locations
            )}

            ${profileSection(
                "Work Preferences",
                profile.work_preferences
            )}

            <div class="profile-section">

                <h3>
                    Experience
                </h3>

                <div class="profile-tags">

                    <span class="profile-tag">
                        ${escapeHtml(
                            String(
                                profile.experience_years ?? 0
                            )
                        )} years
                    </span>

                </div>

            </div>

        </div>

    `;

}
function profileSection(
    title,
    items
) {

    if (
        !Array.isArray(items) ||
        items.length === 0
    ) {

        return "";

    }


    return `

        <div class="profile-section">

            <h3>
                ${escapeHtml(title)}
            </h3>

            <div class="profile-tags">

                ${items.map(item => `

                    <span class="profile-tag">
                        ${escapeHtml(
                            String(item)
                        )}
                    </span>

                `).join("")}

            </div>

        </div>

    `;

}

// ----------------------------------------
// Application state
// ----------------------------------------

let chats = loadChats();

let currentChatId = null;

let conversation = [];


// ----------------------------------------
// Initialize
// ----------------------------------------

initialize();


function initialize() {

    if (chats.length === 0) {

        createNewChat();

    } else {

        currentChatId =
            chats[0].id;

        conversation =
            chats[0].messages || [];

        renderChatList();

        renderConversation();

    }


    messageInput.focus();

}


// ----------------------------------------
// Local storage
// ----------------------------------------

function loadChats() {

    try {

        const saved =
            localStorage.getItem(
                "aiAssistantChats"
            );


        if (!saved) {
            return [];
        }


        return JSON.parse(saved);


    } catch (error) {

        console.error(
            "Could not load chats:",
            error
        );

        return [];

    }

}


function saveChats() {

    localStorage.setItem(
        "aiAssistantChats",
        JSON.stringify(chats)
    );

}


// ----------------------------------------
// Chat ID
// ----------------------------------------

function generateChatId() {

    return (
        Date.now().toString() +
        Math.random()
            .toString(36)
            .substring(2)
    );

}


// ----------------------------------------
// Create chat
// ----------------------------------------

function createNewChat() {

    const chat = {

        id: generateChatId(),

        title: "New Chat",

        messages: [],

        createdAt: Date.now()

    };


    chats.unshift(chat);

    currentChatId =
        chat.id;

    conversation = [];


    saveChats();

    renderChatList();

    renderConversation();

    closeMobileSidebar();

    messageInput.focus();

}


// ----------------------------------------
// Get current chat
// ----------------------------------------

function getCurrentChat() {

    return chats.find(
        chat =>
            chat.id === currentChatId
    );

}


// ----------------------------------------
// Update current chat
// ----------------------------------------

function updateCurrentChat() {

    const chat =
        getCurrentChat();


    if (!chat) {
        return;
    }


    chat.messages =
        conversation;


    saveChats();

}


// ----------------------------------------
// Update title
// ----------------------------------------

function updateChatTitle() {

    const chat =
        getCurrentChat();


    if (!chat) {
        return;
    }


    if (
        conversation.length === 0
    ) {

        chat.title =
            "New Chat";

    } else {

        const firstMessage =
            conversation.find(
                message =>
                    message.role === "user"
            );


        if (firstMessage) {

            chat.title =
                firstMessage.content
                    .substring(0, 35);


            if (
                firstMessage.content.length > 35
            ) {

                chat.title += "...";

            }

        }

    }


    saveChats();

    renderChatList();

}


// ----------------------------------------
// Render chat list
// ----------------------------------------

function renderChatList() {

    chatList.innerHTML = "";


    chats.forEach(chat => {

        const button =
            document.createElement("button");


        button.className =
            "chat-item";


        if (
            chat.id === currentChatId
        ) {

            button.classList.add(
                "active"
            );

        }


        button.textContent =
            chat.title || "New Chat";


        button.addEventListener(
            "click",
            () => {

                switchChat(chat.id);

            }
        );


        chatList.appendChild(
            button
        );

    });

}


// ----------------------------------------
// Switch chat
// ----------------------------------------

function switchChat(chatId) {

    const chat =
        chats.find(
            item =>
                item.id === chatId
        );


    if (!chat) {
        return;
    }


    currentChatId =
        chat.id;


    conversation =
        chat.messages || [];


    renderChatList();

    renderConversation();

    closeMobileSidebar();

    messageInput.focus();

}


// ----------------------------------------
// Render conversation
// ----------------------------------------

function renderConversation() {

    chatContainer.innerHTML = "";


    if (
        conversation.length === 0
    ) {

        renderEmptyState();

        return;

    }


    conversation.forEach(
        message => {

            addMessage(
                message.content,
                message.role
            );

        }
    );


    chatContainer.scrollTop =
        chatContainer.scrollHeight;

}


// ----------------------------------------
// Empty state
// ----------------------------------------

function renderEmptyState() {

    chatContainer.innerHTML = "";

    chatContainer.appendChild(
        emptyState
    );

}


// ----------------------------------------
// Send message
// ----------------------------------------

chatForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        const message =
            messageInput.value.trim();


        if (!message) {
            return;
        }


        // Remove empty state
        if (
            emptyState.parentElement ===
            chatContainer
        ) {

            emptyState.remove();

        }


        addMessage(
            message,
            "user"
        );


        conversation.push({

            role: "user",

            content: message

        });


        updateCurrentChat();

        updateChatTitle();


        messageInput.value = "";

        autoResizeTextarea();


        sendButton.disabled =
            true;


        const assistantBubble =
            createStreamingMessage();


        try {

            const response =
                await fetch(
                    "http://localhost:3000/api/chat",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            messages:
                                conversation
                        })
                    }
                );


            if (!response.ok) {

                throw new Error(
                    "Server returned " +
                    response.status
                );

            }


            if (!response.body) {

                throw new Error(
                    "Streaming is not supported."
                );

            }


            const reader =
                response.body.getReader();


            const decoder =
                new TextDecoder();


            let buffer = "";

            let assistantText = "";


            while (true) {

                const {
                    value,
                    done
                } = await reader.read();


                if (done) {
                    break;
                }


                buffer +=
                    decoder.decode(
                        value,
                        {
                            stream: true
                        }
                    );


                const lines =
                    buffer.split("\n");


                buffer =
                    lines.pop();


                for (
                    const line of lines
                ) {

                    if (!line.trim()) {
                        continue;
                    }


                    try {

                        const data =
                            JSON.parse(line);


                        if (
                            data.message &&
                            data.message.content
                        ) {

                            const token =
                                data.message.content;


                            assistantText +=
                                token;


                            updateStreamingMessage(
                                assistantBubble,
                                assistantText
                            );

                        }

                    } catch (error) {

                        console.error(
                            "Invalid stream data:",
                            line
                        );

                    }

                }

            }

conversation.push({

    role: "assistant",

    content:
        assistantText

});


renderCompletedAssistantMessage(
    assistantBubble,
    assistantText
);


updateCurrentChat();



        } catch (error) {

            console.error(error);


            updateStreamingMessage(
                assistantBubble,
                "Sorry, something went wrong."
            );


        } finally {

            sendButton.disabled =
                false;

            messageInput.focus();

        }

    }
);
function renderCompletedAssistantMessage(
    message,
    text
) {

    const content =
        message.querySelector(
            ".message-content"
        );


    content.innerHTML =
        renderMarkdown(text);


    attachCopyButtons(
        message
    );


    chatContainer.scrollTop =
        chatContainer.scrollHeight;

}


// ----------------------------------------
// New chat
// ----------------------------------------

newChatButton.addEventListener(
    "click",
    function () {

        createNewChat();

    }
);


// ----------------------------------------
// Suggestion buttons
// ----------------------------------------

document
    .querySelectorAll(".suggestion")
    .forEach(button => {

        button.addEventListener(
            "click",
            function () {

                messageInput.value =
                    this.dataset.message;

                autoResizeTextarea();

                messageInput.focus();

            }
        );

    });


// ----------------------------------------
// Enter / Shift + Enter
// ----------------------------------------

messageInput.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault();

            chatForm.requestSubmit();

        }

    }
);


// ----------------------------------------
// Auto resize textarea
// ----------------------------------------

messageInput.addEventListener(
    "input",
    autoResizeTextarea
);


function autoResizeTextarea() {

    messageInput.style.height =
        "auto";


    messageInput.style.height =
        Math.min(
            messageInput.scrollHeight,
            160
        ) + "px";

}


// ----------------------------------------
// Mobile sidebar
// ----------------------------------------

openSidebarButton.addEventListener(
    "click",
    function () {

        sidebar.classList.add(
            "open"
        );

    }
);


closeSidebarButton.addEventListener(
    "click",
    closeMobileSidebar
);


function closeMobileSidebar() {

    sidebar.classList.remove(
        "open"
    );

}


// ----------------------------------------
// Add message
// ----------------------------------------

function addMessage(
    text,
    sender
) {

    const message =
        document.createElement("div");


    message.className =
        `message ${sender}`;


    const content =
        document.createElement("div");


    content.className =
        "message-content";


    if (sender === "assistant") {

        content.classList.add(
            "markdown"
        );

        content.innerHTML =
            renderMarkdown(text);

    } else {

        content.textContent =
            text;

    }


    message.appendChild(
        content
    );


    chatContainer.appendChild(
        message
    );


    attachCopyButtons(message);


    chatContainer.scrollTop =
        chatContainer.scrollHeight;

}
function renderMarkdown(text) {

    if (
        typeof marked === "undefined"
    ) {

        return escapeHtml(text);

    }


    const renderer =
        new marked.Renderer();


    renderer.code = function({
        text,
        lang
    }) {
text = cleanCode(text);

        const language =
            lang || "text";

        let highlighted;


        try {

            if (
                language !== "text" &&
                hljs.getLanguage(language)
            ) {

                highlighted =
                    hljs.highlight(
                        text,
                        {
                            language
                        }
                    ).value;

            } else {

                highlighted =
                    escapeHtml(text);

            }

        } catch (error) {

            highlighted =
                escapeHtml(text);

        }


        return `
            <div class="code-wrapper">

                <div class="code-header">

                    <span>
                        ${escapeHtml(language)}
                    </span>

                    <button
                        class="copy-code-button"
                        type="button"
                        data-code="${encodeURIComponent(text)}"
                    >
                        Copy
                    </button>

                </div>

                <pre><code>${highlighted}</code></pre>

            </div>
        `;

    };


    return marked.parse(
        text,
        {
            renderer,
            breaks: true
        }
    );

}
function cleanCode(text) {

    return text
        .replace(/^\s*\n/, "")
        .replace(/\n\s*$/, "");
}

function attachCopyButtons(
    container
) {

    const buttons =
        container.querySelectorAll(
            ".copy-code-button"
        );


    buttons.forEach(button => {

        button.addEventListener(
            "click",
            async function () {

                const code =
                    decodeURIComponent(
                        this.dataset.code
                    );


                try {

                    await navigator.clipboard
                        .writeText(code);


                    this.textContent =
                        "Copied!";


                    setTimeout(
                        () => {

                            this.textContent =
                                "Copy";

                        },
                        1500
                    );


                } catch (error) {

                    console.error(
                        "Could not copy code:",
                        error
                    );

                }

            }
        );

    });

}



// ----------------------------------------
// Streaming message
// ----------------------------------------

function createStreamingMessage() {

    const message =
        document.createElement("div");


    message.className =
        "message assistant";


    const content =
        document.createElement("div");


    content.className =
        "message-content markdown";


    message.appendChild(
        content
    );


    chatContainer.appendChild(
        message
    );


    chatContainer.scrollTop =
        chatContainer.scrollHeight;


    return message;

}



// ----------------------------------------
// Update streaming message
// ----------------------------------------

function updateStreamingMessage(
    message,
    text
) {

    const content =
        message.querySelector(
            ".message-content"
        );


    content.textContent =
        text;


    chatContainer.scrollTop =
        chatContainer.scrollHeight;

}



// ----------------------------------------
// Escape HTML
// ----------------------------------------

function escapeHtml(text) {

    const div =
        document.createElement("div");


    div.textContent =
        text;


    return div.innerHTML;

}

async function searchMatchingJobs(profile) {

    const jobResults =
        document.getElementById(
            "jobResults"
        );

    const jobList =
        document.getElementById(
            "jobList"
        );

    const jobCount =
        document.getElementById(
            "jobCount"
        );


    jobResults.hidden = false;


    jobList.innerHTML = `

        <div class="jobs-loading">

            Finding jobs that match your resume...

        </div>

    `;


    try {

        /*
         * First discover real jobs.
         */

        const searchResponse =
            await fetch(
                "/api/jobs/search",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            profile:
                                profile
                        })
                }
            );


        const searchData =
            await searchResponse.json();


        if (
            !searchResponse.ok
        ) {

            throw new Error(
                searchData.error ||
                "Job search failed."
            );

        }


        const jobs =
            Array.isArray(
                searchData.jobs
            )
                ? searchData.jobs
                : [];


        if (
            jobs.length === 0
        ) {

            jobCount.textContent =
                "0 jobs";


            jobList.innerHTML = `

                <div class="jobs-empty">

                    No matching jobs were found.

                </div>

            `;

            return;

        }


        /*
         * Now send the discovered jobs
         * to the matching endpoint.
         */

        jobList.innerHTML = `

            <div class="jobs-loading">

                Matching ${jobs.length} jobs
                against your resume...

            </div>

        `;


        const matchResponse =
            await fetch(
                "/api/jobs/match",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                   body:
    JSON.stringify({

        profile:
            profile,

        jobs:
            jobs.map(job => ({

                title:
                    job.title,

                company:
                    job.company,

                location:
                    job.location,

                source:
                    job.source,

                url:
                    job.url,

                applyUrl:
                    job.applyUrl,

                description:
                    String(
                        job.description || ""
                    ).substring(
                        0,
                        5000
                    )

            }))

    })

                }
            );


        const matchText =
    await matchResponse.text();

let matchData;

try {

    matchData =
        JSON.parse(
            matchText
        );

} catch {

    throw new Error(
        `Server returned ${matchResponse.status}`
    );

}



        if (
            !matchResponse.ok
        ) {

            throw new Error(
                matchData.error ||
                "Job matching failed."
            );

        }


        const matchedJobs =
            Array.isArray(
                matchData.jobs
            )
                ? matchData.jobs
                : [];


        jobCount.textContent =
            `${matchedJobs.length} matches`;


        if (
            matchedJobs.length === 0
        ) {

            jobList.innerHTML = `

                <div class="jobs-empty">

                    No suitable job matches were found.

                </div>

            `;

            return;

        }


        /*
         * Backend already sorts by match score,
         * but sort again here to keep the UI
         * deterministic.
         */

        matchedJobs.sort(
            (a, b) =>
                (
                    b.match?.score || 0
                ) -
                (
                    a.match?.score || 0
                )
        );


        jobList.innerHTML =
            matchedJobs
                .map(
                    job =>
                        createMatchedJobCard(
                            job
                        )
                )
                .join("");
updateResumeProgress(
    100,
    "Complete"
);


    } catch (error) {

        console.error(
            "Job matching error:",
            error
        );


        jobList.innerHTML = `

            <div class="jobs-error">

                Could not analyze the job listings.

                <br>

                <small>
                    ${escapeHtml(
                        error.message
                    )}
                </small>

            </div>

        `;

    }

}
function createMatchedJobCard(job) {

    const title =
        escapeHtml(
            job.title ||
            "Untitled position"
        );


    const company =
        escapeHtml(
            job.company ||
            "Unknown company"
        );


    const location =
        escapeHtml(
            job.location ||
            "Location not specified"
        );


    const source =
        escapeHtml(
            job.source ||
            "Job board"
        );


    const match =
        job.match || {};


    const score =
        Number(
            match.score || 0
        );


    const matchedSkills =
        Array.isArray(
            match.matchedSkills
        )
            ? match.matchedSkills
            : [];


    const missingSkills =
        Array.isArray(
            match.missingSkills
        )
            ? match.missingSkills
            : [];


    const explanation =
        job.explanation || {};


    const summary =
        explanation.summary ||
        "This job contains skills or role requirements that overlap with your resume.";


    const applicationUrl =
        job.applyUrl ||
        job.url ||
        "#";


    const scoreClass =
        score >= 75
            ? "match-high"
            : score >= 50
                ? "match-medium"
                : "match-low";


    const matchedHtml =
        matchedSkills.length > 0

            ? matchedSkills
                .slice(0, 8)
                .map(
                    skill => `
                        <span class="match-tag matched">
                            ✓ ${escapeHtml(skill)}
                        </span>
                    `
                )
                .join("")

            : `
                <span class="match-none">
                    No direct skill matches found
                </span>
            `;


    const missingHtml =
        missingSkills.length > 0

            ? missingSkills
                .slice(0, 6)
                .map(
                    skill => `
                        <span class="match-tag missing">
                            ${escapeHtml(skill)}
                        </span>
                    `
                )
                .join("")

            : `
                <span class="match-none">
                    No obvious gaps identified
                </span>
            `;


    return `

        <article class="job-card matched-job-card">

            <div class="job-card-content">

                <div class="job-card-top">

                    <div>

                        <h3>
                            ${title}
                        </h3>

                        <div class="job-company">
                            ${company}
                        </div>

                    </div>


                    <div class="job-match-score ${scoreClass}">

                        ${score}%

                        <span>
                            match
                        </span>

                    </div>

                </div>


                <div class="job-meta-row">

                    <span class="job-location">
                        📍 ${location}
                    </span>

                    <span class="job-source">
                        ${source}
                    </span>

                </div>


                <div class="match-section">

                    <div class="match-section-title">
                        Matched skills
                    </div>

                    <div class="match-tags">

                        ${matchedHtml}

                    </div>

                </div>


                ${
                    missingSkills.length > 0
                        ? `
                            <div class="match-section">

                                <div class="match-section-title">
                                    Possible gaps
                                </div>

                                <div class="match-tags">

                                    ${missingHtml}

                                </div>

                            </div>
                        `
                        : ""
                }


                <div class="job-match-summary">

                    ${escapeHtml(
                        summary
                    )}

                </div>

            </div>


            <div class="job-card-actions">

                <a
                    href="${escapeAttribute(
                        applicationUrl
                    )}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="job-apply-button"
                >
                    Apply
                </a>

            </div>

        </article>

    `;

}

function createJobCard(job) {

    const title =
        escapeHtml(
            job.title ||
            "Untitled position"
        );


    const company =
        escapeHtml(
            job.company ||
            "Unknown company"
        );


    const location =
        escapeHtml(
            job.location ||
            "Location not specified"
        );


    const source =
        escapeHtml(
            job.source ||
            "Job board"
        );


    const description =
        escapeHtml(
            job.description ||
            ""
        );


    const shortenedDescription =
        description.length > 240
            ? description.substring(
                0,
                240
            ) + "..."
            : description;


    const applicationUrl =
        job.applyUrl ||
        job.url ||
        "#";


    return `

        <article class="job-card">

            <div class="job-card-content">

                <div class="job-card-top">

                    <div>

                        <h3>
                            ${title}
                        </h3>

                        <div class="job-company">
                            ${company}
                        </div>

                    </div>

                    <span class="job-source">
                        ${source}
                    </span>

                </div>


                <div class="job-location">

                    📍 ${location}

                </div>


                ${
                    shortenedDescription
                        ? `
                            <p class="job-description">
                                ${shortenedDescription}
                            </p>
                        `
                        : ""
                }

            </div>


            <div class="job-card-actions">

                <a
                    href="${escapeAttribute(
                        applicationUrl
                    )}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="job-apply-button"
                >
                    Apply
                </a>

            </div>

        </article>

    `;

}

function escapeHtml(value) {

    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}

function escapeAttribute(value) {

    return escapeHtml(
        value
    );

}
function showResumeProgress() {

    const progress =
        document.getElementById(
            "resumeProgress"
        );


    progress.hidden = false;


    updateResumeProgress(
        0,
        "Starting..."
    );

}
function updateResumeProgress(
    percent,
    status
) {

    const bar =
        document.getElementById(
            "resumeProgressBar"
        );

    const percentText =
        document.getElementById(
            "resumeProgressPercent"
        );

    const statusText =
        document.getElementById(
            "resumeProgressStatus"
        );


    bar.style.width =
        `${percent}%`;


    percentText.textContent =
        `${percent}%`;


    statusText.textContent =
        status;


    updateProgressSteps(
        percent
    );

}
function updateProgressSteps(
    percent
) {

    const steps = [

        {
            id:
                "progressStepUpload",

            threshold:
                20
        },

        {
            id:
                "progressStepExtract",

            threshold:
                40
        },

        {
            id:
                "progressStepAnalyze",

            threshold:
                60
        },

        {
            id:
                "progressStepJobs",

            threshold:
                80
        },

        {
            id:
                "progressStepMatch",

            threshold:
                95
        },

        {
            id:
                "progressStepDone",

            threshold:
                100
        }

    ];


    steps.forEach(
        step => {

            const element =
                document.getElementById(
                    step.id
                );


            element.classList.remove(
                "active",
                "completed"
            );


            if (
                percent >=
                step.threshold
            ) {

                element.classList.add(
                    "completed"
                );

            }

            else if (
                percent >=
                step.threshold - 20
            ) {

                element.classList.add(
                    "active"
                );

            }

        }
    );

}
