const multer = require("multer");
const path = require("path");
const fs = require("fs");

const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

const express = require("express");
const cors = require("cors");

const app = express();

const PORT = process.env.PORT || 3000;

const OLLAMA_URL =
    "http://localhost:11434/api/chat";

const MODEL =
    "llama3.2";


/* =========================================================
   Middleware
========================================================= */

app.use(cors());

app.use(
    express.json({
        limit: "10mb"
    })
);

app.use(
    express.static(
        path.join(
            __dirname,
            "../frontend"
        )
    )
);


const upload = multer({

    dest:
        path.join(
            __dirname,
            "uploads"
        ),

    limits: {
        fileSize:
            10 * 1024 * 1024
    }

});


/* =========================================================
   Resume Analysis
========================================================= */

async function analyzeResume(
    resumeText
) {

    const prompt = `
You are a resume analysis engine.

Analyze the resume below and return ONLY valid JSON.

Do not use Markdown.
Do not include explanations.
Do not include code fences.

Use exactly this structure:

{
  "target_roles": [],
  "skills": [],
  "tools_and_technologies": [],
  "experience_years": 0,
  "education": [],
  "certifications": [],
  "industries": [],
  "locations": [],
  "work_preferences": []
}

Rules:

- target_roles: likely job titles based only on the resume.
- skills: professional skills explicitly supported by the resume.
- tools_and_technologies: programming languages, frameworks, databases, software, platforms and tools.
- experience_years: estimate from documented employment history. Use 0 if it cannot be determined.
- education: degrees and educational qualifications.
- certifications: certifications explicitly mentioned.
- industries: industries supported by the candidate's experience.
- locations: locations explicitly associated with the candidate.
- work_preferences: only include remote, hybrid, onsite, relocation, or similar preferences if supported by the resume.
- Do not invent information.
- Use empty arrays when information is unavailable.

RESUME:

${resumeText}
`;


    const ollamaResponse =
        await fetch(
            OLLAMA_URL,
            {

                method:
                    "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify({

                        model:
                            MODEL,

                        messages: [
                            {
                                role:
                                    "user",

                                content:
                                    prompt
                            }
                        ],

                        stream:
                            false

                    })

            }
        );


    if (
        !ollamaResponse.ok
    ) {

        const errorText =
            await ollamaResponse.text();

        throw new Error(
            `Ollama resume analysis failed: ${ollamaResponse.status} ${errorText}`
        );

    }


    const result =
        await ollamaResponse.json();


    return result
        .message
        .content;

}


/* =========================================================
   Resume JSON Parser
========================================================= */

function parseResumeProfile(
    text
) {

    let cleaned =
        text.trim();


    cleaned =
        cleaned.replace(
            /^```json\s*/i,
            ""
        );


    cleaned =
        cleaned.replace(
            /^```\s*/i,
            ""
        );


    cleaned =
        cleaned.replace(
            /\s*```$/i,
            ""
        );


    try {

        return JSON.parse(
            cleaned
        );

    }

    catch (error) {

        console.error(
            "Resume JSON parsing error:",
            error
        );

        console.error(
            "Ollama response:",
            text
        );

        throw new Error(
            "Ollama returned invalid resume JSON."
        );

    }

}


/* =========================================================
   Helpers
========================================================= */

function stripHtml(
    html
) {

    return String(
        html || ""
    )
        .replace(
            /<[^>]*>/g,
            " "
        )
        .replace(
            /\s+/g,
            " "
        )
        .trim();

}


function normalizeText(
    value
) {

    return String(
        value || ""
    )
        .toLowerCase()
        .replace(
            /[^a-z0-9+#.\- ]/g,
            " "
        )
        .replace(
            /\s+/g,
            " "
        )
        .trim();

}


/* =========================================================
   Health Check
========================================================= */

app.get(
    "/api/health",
    (req, res) => {

        res.json({

            success:
                true,

            message:
                "AI Assistant backend is running"

        });

    }
);


/* =========================================================
   EXISTING GREENHOUSE SOURCE
   Kept temporarily as a working fallback.
========================================================= */

async function searchGreenhouseJobs(
    query
) {

    const companies = [

        {
            name:
                "Atlassian",

            board:
                "atlassian"
        },

        {
            name:
                "Stripe",

            board:
                "stripe"
        },

        {
            name:
                "Datadog",

            board:
                "datadog"
        },

        {
            name:
                "Cloudflare",

            board:
                "cloudflare"
        },

        {
            name:
                "GitLab",

            board:
                "gitlab"
        }

    ];


    const results = [];


    for (
        const company
        of companies
    ) {

        try {

            const url =
                `https://boards-api.greenhouse.io/v1/boards/${company.board}/jobs?content=true`;


            const response =
                await fetch(
                    url
                );


            if (
                !response.ok
            ) {
                continue;
            }


            const data =
                await response.json();


            const jobs =
                Array.isArray(
                    data.jobs
                )
                    ? data.jobs
                    : [];


            for (
                const job
                of jobs
            ) {

                const searchableText =
                    [

                        job.title,

                        job.location?.name,

                        job.content

                    ]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase();


                if (
                    searchableText.includes(
                        query.toLowerCase()
                    )
                ) {

                    results.push({

                        source:
                            "Greenhouse",

                        company:
                            company.name,

                        title:
                            job.title,

                        location:
                            job.location?.name ||
                            "Not specified",

                        url:
                            job.absolute_url,

                        applyUrl:
                            job.absolute_url,

                        description:
                            stripHtml(
                                job.content ||
                                ""
                            )

                    });

                }

            }

        }

        catch (error) {

            console.error(
                `Greenhouse error (${company.name}):`,
                error.message
            );

        }

    }


    return results;

}


/* =========================================================
   EXISTING LEVER SOURCE
   Kept temporarily as a working fallback.
========================================================= */

async function searchLeverJobs(
    query
) {

    const companies = [

        {
            name:
                "Netflix",

            slug:
                "netflix"
        },

        {
            name:
                "Shopify",

            slug:
                "shopify"
        },

        {
            name:
                "Brex",

            slug:
                "brex"
        },

        {
            name:
                "Ramp",

            slug:
                "ramp"
        }

    ];


    const results = [];


    for (
        const company
        of companies
    ) {

        try {

            const url =
                `https://api.lever.co/v0/postings/${company.slug}?mode=json`;


            const response =
                await fetch(
                    url
                );


            if (
                !response.ok
            ) {
                continue;
            }


            const jobs =
                await response.json();


            if (
                !Array.isArray(
                    jobs
                )
            ) {
                continue;
            }


            for (
                const job
                of jobs
            ) {

                const searchableText =
                    [

                        job.text,

                        job.categories?.team,

                        job.categories?.location,

                        job.descriptionPlain

                    ]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase();


                if (
                    searchableText.includes(
                        query.toLowerCase()
                    )
                ) {

                    results.push({

                        source:
                            "Lever",

                        company:
                            company.name,

                        title:
                            job.text,

                        location:
                            job.categories?.location ||
                            "Not specified",

                        url:
                            job.hostedUrl ||
                            job.applyUrl,

                        applyUrl:
                            job.applyUrl,

                        description:
                            job.descriptionPlain ||
                            ""

                    });

                }

            }

        }

        catch (error) {

            console.error(
                `Lever error (${company.name}):`,
                error.message
            );

        }

    }


    return results;

}


/* =========================================================
   MODULE 10E
   Naukri Source
========================================================= */

async function searchNaukriJobs(
    query,
    location = "India"
) {

    /*
     * Placeholder for an authorized
     * Naukri integration.
     *
     * Do NOT scrape Naukri directly here.
     */

    console.log(
        `[Naukri] ${query} | ${location}`
    );


    return [];

}


/* =========================================================
   MODULE 10E
   Indeed Source
========================================================= */

async function searchIndeedJobs(
    query,
    location = "India"
) {

    /*
     * Placeholder for an authorized
     * Indeed API/data integration.
     */

    console.log(
        `[Indeed] ${query} | ${location}`
    );


    return [];

}


/* =========================================================
   MODULE 10E
   LinkedIn Source
========================================================= */

async function searchLinkedInJobs(
    query,
    location = "India"
) {

    /*
     * Placeholder for an authorized
     * LinkedIn integration.
     */

    console.log(
        `[LinkedIn] ${query} | ${location}`
    );


    return [];

}


/* =========================================================
   Resume Upload + Analysis
========================================================= */

app.post(
    "/api/resume/upload",
    upload.single("resume"),
    async (req, res) => {

        if (
            !req.file
        ) {

            return res.status(
                400
            ).json({

                error:
                    "Please upload a resume."

            });

        }


        const filePath =
            req.file.path;


        const originalName =
            req.file.originalname;


        const extension =
            path.extname(
                originalName
            ).toLowerCase();


        try {

            let text =
                "";


            if (
                extension === ".pdf"
            ) {

                const buffer =
                    fs.readFileSync(
                        filePath
                    );


                const result =
                    await pdfParse(
                        buffer
                    );


                text =
                    result.text;

            }


            else if (
                extension === ".docx"
            ) {

                const result =
                    await mammoth.extractRawText({

                        path:
                            filePath

                    });


                text =
                    result.value;

            }


            else if (
                extension === ".txt"
            ) {

                text =
                    fs.readFileSync(
                        filePath,
                        "utf8"
                    );

            }


            else {

                return res.status(
                    400
                ).json({

                    error:
                        "Unsupported file type. Use PDF, DOCX, or TXT."

                });

            }


            text =
                text.trim();


            if (
                !text
            ) {

                return res.status(
                    400
                ).json({

                    error:
                        "Could not extract any text from the resume."

                });

            }


            const analysis =
                await analyzeResume(
                    text
                );


            const profile =
                parseResumeProfile(
                    analysis
                );


            res.json({

                success:
                    true,

                filename:
                    originalName,

                textLength:
                    text.length,

                profile

            });

        }

        catch (error) {

            console.error(
                "Resume extraction error:",
                error
            );


            res.status(
                500
            ).json({

                error:
                    "Could not process the resume."

            });

        }

        finally {

            fs.unlink(
                filePath,
                () => {}
            );

        }

    }
);


/* =========================================================
   Local Job Matching
========================================================= */

function calculateJobMatch(
    profile,
    job
) {

    const resumeSkills = [

        ...(profile.skills || []),

        ...(profile.tools_and_technologies || []),

        ...(profile.target_roles || [])

    ]
        .map(
            normalizeText
        )
        .filter(Boolean);


    const jobText =
        normalizeText(

            [

                job.title,

                job.description,

                job.location

            ]
                .filter(Boolean)
                .join(" ")

        );


    const matchedSkills = [];

    const missingSkills = [];


    const uniqueSkills =
        [
            ...new Set(
                resumeSkills
            )
        ];


    for (
        const skill
        of uniqueSkills
    ) {

        if (
            skill.length < 2
        ) {
            continue;
        }


        if (
            jobText.includes(
                skill
            )
        ) {

            matchedSkills.push(
                skill
            );

        }

    }


    const commonJobSkills = [

        "javascript",

        "typescript",

        "node.js",

        "node",

        "python",

        "java",

        "c#",

        "c++",

        "react",

        "angular",

        "vue",

        "express",

        "next.js",

        "mongodb",

        "mysql",

        "postgresql",

        "sql",

        "redis",

        "docker",

        "kubernetes",

        "aws",

        "azure",

        "gcp",

        "git",

        "github",

        "rest api",

        "graphql",

        "html",

        "css",

        "linux",

        "terraform",

        "jenkins"

    ];


    for (
        const skill
        of commonJobSkills
    ) {

        if (

            jobText.includes(
                skill
            )

            &&

            !resumeSkills.some(
                resumeSkill =>
                    resumeSkill.includes(
                        skill
                    )
                    ||
                    skill.includes(
                        resumeSkill
                    )
            )

        ) {

            missingSkills.push(
                skill
            );

        }

    }


    let score =
        0;


    if (
        matchedSkills.length > 0
    ) {

        score += Math.min(

            matchedSkills.length * 8,

            56

        );

    }


    const roleMatch =
        (
            profile.target_roles || []
        )
            .some(
                role => {

                    const roleText =
                        normalizeText(
                            role
                        );


                    const jobTitle =
                        normalizeText(
                            job.title
                        );


                    return (

                        roleText

                        &&

                        (

                            jobTitle.includes(
                                roleText
                            )

                            ||

                            roleText.includes(
                                jobTitle
                            )

                        )

                    );

                }
            );


    if (
        roleMatch
    ) {

        score +=
            30;

    }


    const locationMatch =
        (
            profile.locations || []
        )
            .some(
                location => {

                    const normalizedLocation =
                        normalizeText(
                            location
                        );


                    return (

                        normalizedLocation

                        &&

                        jobText.includes(
                            normalizedLocation
                        )

                    );

                }
            );


    if (
        locationMatch
    ) {

        score +=
            10;

    }


    score =
        Math.min(
            Math.round(
                score
            ),
            100
        );


    return {

        score,

        matchedSkills:
            matchedSkills.slice(
                0,
                12
            ),

        missingSkills:
            missingSkills.slice(
                0,
                10
            ),

        roleMatch,

        locationMatch

    };

}


/* =========================================================
   AI Job Explanation
========================================================= */

async function explainJobMatch(
    profile,
    job,
    match
) {

    const prompt = `
You are explaining why a job may or may not match a candidate.

Use ONLY the information supplied below.

Do not invent experience, skills, qualifications,
salary, location, company information, or requirements.

Return ONLY valid JSON.

Use exactly this structure:

{
  "summary": "",
  "matched_reasons": [],
  "missing_requirements": []
}

Candidate profile:
${JSON.stringify(
    profile,
    null,
    2
)}

Job:
${JSON.stringify({

    title:
        job.title,

    company:
        job.company,

    location:
        job.location,

    description:
        job.description

}, null, 2)}

Calculated match information:
${JSON.stringify(
    match,
    null,
    2
)}
`;


    const response =
        await fetch(
            OLLAMA_URL,
            {

                method:
                    "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify({

                        model:
                            MODEL,

                        messages: [

                            {

                                role:
                                    "user",

                                content:
                                    prompt

                            }

                        ],

                        stream:
                            false

                    })

            }
        );


    if (
        !response.ok
    ) {

        throw new Error(
            `Ollama match explanation failed: ${response.status}`
        );

    }


    const data =
        await response.json();


    return parseResumeProfile(
        data.message.content
    );

}


/* =========================================================
   MODULE 10C / 10E
   Job Search
========================================================= */

app.post(
    "/api/jobs/search",
    async (req, res) => {

        try {

            const {
                profile
            } = req.body;


            if (
                !profile
            ) {

                return res.status(
                    400
                ).json({

                    success:
                        false,

                    error:
                        "Resume profile is required."

                });

            }


            const roles =
                Array.isArray(
                    profile.target_roles
                )
                    ? profile.target_roles
                    : [];


            const skills =
                Array.isArray(
                    profile.skills
                )
                    ? profile.skills
                    : [];


            const technologies =
                Array.isArray(
                    profile.tools_and_technologies
                )
                    ? profile.tools_and_technologies
                    : [];


            const searchTerms = [

                ...roles,

                ...skills,

                ...technologies

            ];


            const uniqueTerms =
                [
                    ...new Set(

                        searchTerms
                            .filter(Boolean)
                            .map(
                                term =>
                                    String(
                                        term
                                    ).trim()
                            )

                    )

                ]
                    .slice(
                        0,
                        8
                    );


            if (
                uniqueTerms.length === 0
            ) {

                return res.json({

                    success:
                        true,

                    searchTerms:
                        [],

                    jobs:
                        []

                });

            }


            /* -----------------------------------------
               Location
            ----------------------------------------- */

            const profileLocations =
                Array.isArray(
                    profile.locations
                )
                    ? profile.locations
                    : [];


            const preferredLocations = [

                ...profileLocations,

                "India"

            ];


            if (

                !preferredLocations.some(

                    location =>

                        String(
                            location
                        )
                            .toLowerCase()
                            .includes(
                                "bengaluru"
                            )

                )

            ) {

                preferredLocations.push(
                    "Bengaluru"
                );

            }


            const locationText =
                [
                    ...new Set(
                        preferredLocations
                    )
                ]
                    .join(" ");


            /* -----------------------------------------
               Source searches
            ----------------------------------------- */

            const sourceResults =
                [];


            /*
             * Naukri
             */

            const naukriResults =
                await Promise.all(

                    uniqueTerms.map(
                        term =>
                            searchNaukriJobs(
                                `${term} ${locationText}`,
                                locationText
                            )
                    )

                );


            sourceResults.push(
                ...naukriResults.flat()
            );


            /*
             * Indeed
             */

            const indeedResults =
                await Promise.all(

                    uniqueTerms.map(
                        term =>
                            searchIndeedJobs(
                                `${term} ${locationText}`,
                                locationText
                            )
                    )

                );


            sourceResults.push(
                ...indeedResults.flat()
            );


            /*
             * LinkedIn
             */

            const linkedInResults =
                await Promise.all(

                    uniqueTerms.map(
                        term =>
                            searchLinkedInJobs(
                                `${term} ${locationText}`,
                                locationText
                            )
                    )

                );


            sourceResults.push(
                ...linkedInResults.flat()
            );


            /*
             * Existing fallback sources.
             *
             * Keep these until the three new
             * authorized integrations are connected.
             */

            const greenhouseResults =
                await Promise.all(

                    uniqueTerms.map(
                        term =>
                            searchGreenhouseJobs(
                                `${term} ${locationText}`
                            )
                    )

                );


            sourceResults.push(
                ...greenhouseResults.flat()
            );


            const leverResults =
                await Promise.all(

                    uniqueTerms.map(
                        term =>
                            searchLeverJobs(
                                `${term} ${locationText}`
                            )
                    )

                );


            sourceResults.push(
                ...leverResults.flat()
            );


            /* -----------------------------------------
               Deduplicate
            ----------------------------------------- */

            const uniqueJobs =
                Array.from(

                    new Map(

                        sourceResults
                            .filter(
                                job =>
                                    job &&
                                    job.url
                            )
                            .map(
                                job => [

                                    job.url,

                                    job

                                ]
                            )

                    ).values()

                );


            /*
             * Sort India-related jobs first.
             */

            uniqueJobs.sort(
                (
                    a,
                    b
                ) => {

                    const aLocation =
                        normalizeText(
                            a.location
                        );


                    const bLocation =
                        normalizeText(
                            b.location
                        );


                    const aIndia =
                        aLocation.includes(
                            "india"
                        )
                        ||
                        aLocation.includes(
                            "bengaluru"
                        )
                        ||
                        aLocation.includes(
                            "bangalore"
                        );


                    const bIndia =
                        bLocation.includes(
                            "india"
                        )
                        ||
                        bLocation.includes(
                            "bengaluru"
                        )
                        ||
                        bLocation.includes(
                            "bangalore"
                        );


                    if (
                        aIndia &&
                        !bIndia
                    ) {
                        return -1;
                    }


                    if (
                        !aIndia &&
                        bIndia
                    ) {
                        return 1;
                    }


                    return 0;

                }
            );


            res.json({

                success:
                    true,

                searchTerms:
                    uniqueTerms,

                locations:
                    preferredLocations,

                sources: [

                    "Naukri",

                    "Indeed",

                    "LinkedIn",

                    "Greenhouse",

                    "Lever"

                ],

                jobs:
                    uniqueJobs.slice(
                        0,
                        30
                    )

            });

        }

        catch (error) {

            console.error(
                "Job search error:",
                error
            );


            res.status(
                500
            ).json({

                success:
                    false,

                error:
                    "Could not search for jobs."

            });

        }

    }
);


/* =========================================================
   MODULE 10D
   Job Matching
========================================================= */

app.post(
    "/api/jobs/match",
    async (req, res) => {

        try {

            const {
                profile,
                jobs
            } = req.body;


            if (
                !profile
            ) {

                return res.status(
                    400
                ).json({

                    success:
                        false,

                    error:
                        "Resume profile is required."

                });

            }


            if (
                !Array.isArray(
                    jobs
                )
            ) {

                return res.status(
                    400
                ).json({

                    success:
                        false,

                    error:
                        "Job listings are required."

                });

            }


            const matchedJobs =
                jobs.map(
                    job => {

                        const match =
                            calculateJobMatch(
                                profile,
                                job
                            );


                        return {

                            ...job,

                            match

                        };

                    }
                );


            matchedJobs.sort(

                (
                    a,
                    b
                ) =>

                    (
                        b.match?.score ||
                        0
                    )

                    -

                    (
                        a.match?.score ||
                        0
                    )

            );


            res.json({

                success:
                    true,

                jobs:
                    matchedJobs.slice(
                        0,
                        30
                    )

            });

        }

        catch (error) {

            console.error(
                "Job matching error:",
                error
            );


            if (
                !res.headersSent
            ) {

                res.status(
                    500
                ).json({

                    success:
                        false,

                    error:
                        "Could not match jobs."

                });

            }

        }

    }
);


/* =========================================================
   Chat
========================================================= */

app.post(
    "/api/chat",
    async (req, res) => {

        try {

            const {
                messages
            } = req.body;


            if (
                !Array.isArray(
                    messages
                )
                ||
                messages.length === 0
            ) {

                return res.status(
                    400
                ).json({

                    success:
                        false,

                    error:
                        "Conversation messages are required."

                });

            }


            const ollamaResponse =
                await fetch(
                    OLLAMA_URL,
                    {

                        method:
                            "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({

                                model:
                                    MODEL,

                                messages:
                                    messages,

                                stream:
                                    true

                            })

                    }
                );


            if (
                !ollamaResponse.ok
            ) {

                const errorText =
                    await ollamaResponse.text();


                throw new Error(

                    `Ollama returned ${ollamaResponse.status}: ${errorText}`

                );

            }


            res.setHeader(
                "Content-Type",
                "application/x-ndjson"
            );


            res.setHeader(
                "Cache-Control",
                "no-cache"
            );


            res.setHeader(
                "Connection",
                "keep-alive"
            );


            for await (
                const chunk
                of ollamaResponse.body
            ) {

                res.write(
                    chunk
                );

            }


            res.end();

        }

        catch (error) {

            console.error(
                "Ollama streaming error:",
                error
            );


            if (
                !res.headersSent
            ) {

                res.status(
                    500
                ).json({

                    success:
                        false,

                    error:
                        error.message

                });

            }

            else {

                res.end();

            }

        }

    }
);


/* =========================================================
   Start Server
========================================================= */

app.listen(
    PORT,
    () => {

        console.log(
            `AI Assistant backend running on http://localhost:${PORT}`
        );

    }
);
