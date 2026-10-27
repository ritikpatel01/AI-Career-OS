const axios = require("axios");


// ============================================================
// GITHUB API CONFIGURATION
// ============================================================

const GITHUB_API = "https://api.github.com";

const GITHUB_API_VERSION = "2022-11-28";


// ============================================================
// GITHUB HTTP CLIENT
// ============================================================

const githubClient = axios.create({
    baseURL: GITHUB_API,

    timeout: 15000,

    headers: {
        Accept: "application/vnd.github+json",

        "X-GitHub-Api-Version":
            GITHUB_API_VERSION,

        "User-Agent":
            "AI-Career-OS"
    }
});


// ============================================================
// OPTIONAL GITHUB TOKEN
// ============================================================
//
// GITHUB_TOKEN is optional.
//
// Public GitHub repositories can be accessed without
// authentication.
//
// If GITHUB_TOKEN exists in .env, it can provide
// authenticated requests and better API rate limits.
//

if (process.env.GITHUB_TOKEN) {
    githubClient.defaults.headers.common[
        "Authorization"
    ] = `Bearer ${process.env.GITHUB_TOKEN}`;
}


// ============================================================
// GITHUB ERROR HANDLER
// ============================================================

const handleGithubError = (
    error,
    action
) => {

    if (error.response) {

        const status =
            error.response.status;


        if (status === 404) {

            throw new Error(
                "GitHub user or resource not found."
            );
        }


        if (status === 403) {

            throw new Error(
                "GitHub API rate limit reached. Please try again later."
            );
        }


        if (status === 429) {

            throw new Error(
                "GitHub API rate limit exceeded. Please try again later."
            );
        }


        throw new Error(
            `GitHub ${action} failed with status ${status}.`
        );
    }


    if (error.code === "ECONNABORTED") {

        throw new Error(
            "GitHub API request timed out."
        );
    }


    throw new Error(
        `Unable to ${action} from GitHub.`
    );
};


// ============================================================
// GET GITHUB USER PROFILE
// ============================================================

const getGithubUser = async (
    username
) => {

    try {

        const response =
            await githubClient.get(
                `/users/${encodeURIComponent(
                    username
                )}`
            );

        return response.data;

    } catch (error) {

        handleGithubError(
            error,
            "fetch GitHub profile"
        );
    }
};


// ============================================================
// GET GITHUB REPOSITORIES
// ============================================================

const getGithubRepositories = async (
    username
) => {

    try {

        const response =
            await githubClient.get(
                `/users/${encodeURIComponent(
                    username
                )}/repos`,
                {
                    params: {
                        per_page: 100,
                        sort: "updated",
                        direction: "desc"
                    }
                }
            );

        return response.data;

    } catch (error) {

        handleGithubError(
            error,
            "fetch GitHub repositories"
        );
    }
};


// ============================================================
// GET REPOSITORY LANGUAGES
// ============================================================

const getRepositoryLanguages = async (
    owner,
    repo
) => {

    try {

        const response =
            await githubClient.get(
                `/repos/${encodeURIComponent(
                    owner
                )}/${encodeURIComponent(
                    repo
                )}/languages`
            );

        return response.data || {};

    } catch (error) {

        // Language information is useful,
        // but failure here should not stop
        // the complete GitHub analysis.

        console.error(
            `GitHub language error for ${owner}/${repo}:`,
            error.message
        );

        return {};
    }
};


// ============================================================
// GET REPOSITORY README
// ============================================================

const getRepositoryReadme = async (
    owner,
    repo
) => {

    try {

        const response =
            await githubClient.get(
                `/repos/${encodeURIComponent(
                    owner
                )}/${encodeURIComponent(
                    repo
                )}/readme`
            );

        const data =
            response.data;

        let content = "";


        if (
            data &&
            data.content
        ) {

            content =
                Buffer.from(
                    data.content,
                    "base64"
                ).toString(
                    "utf-8"
                );
        }


        return {

            exists: true,

            name:
                data.name ||
                "README.md",

            size:
                data.size || 0,

            content,

            htmlUrl:
                data.html_url ||
                null
        };

    } catch (error) {

        // README not found is a normal situation.

        if (
            error.response &&
            error.response.status === 404
        ) {

            return {

                exists: false,

                name: null,

                size: 0,

                content: "",

                htmlUrl: null
            };
        }


        console.error(
            `README error for ${owner}/${repo}:`,
            error.message
        );


        return {

            exists: false,

            name: null,

            size: 0,

            content: "",

            htmlUrl: null
        };
    }
};


// ============================================================
// GET SINGLE REPOSITORY
// ============================================================

const getRepository = async (
    owner,
    repo
) => {

    try {

        const response =
            await githubClient.get(
                `/repos/${encodeURIComponent(
                    owner
                )}/${encodeURIComponent(
                    repo
                )}`
            );

        return response.data;

    } catch (error) {

        handleGithubError(
            error,
            "fetch GitHub repository"
        );
    }
};


// ============================================================
// GET RECENT PUBLIC EVENTS
// ============================================================

const getGithubEvents = async (
    username
) => {

    try {

        const response =
            await githubClient.get(
                `/users/${encodeURIComponent(
                    username
                )}/events/public`,
                {
                    params: {
                        per_page: 100
                    }
                }
            );

        return response.data || [];

    } catch (error) {

        console.error(
            "GitHub events error:",
            error.message
        );

        return [];
    }
};


// ============================================================
// GET RECENT REPOSITORY COMMITS
// ============================================================

const getRepositoryCommits = async (
    owner,
    repo
) => {

    try {

        const response =
            await githubClient.get(
                `/repos/${encodeURIComponent(
                    owner
                )}/${encodeURIComponent(
                    repo
                )}/commits`,
                {
                    params: {
                        per_page: 10
                    }
                }
            );

        return response.data || [];

    } catch (error) {

        console.error(
            `Commit error for ${owner}/${repo}:`,
            error.message
        );

        return [];
    }
};


// ============================================================
// COLLECT DATA FOR ONE REPOSITORY
// ============================================================

const collectRepositoryData = async (
    repository
) => {

    const owner =
        repository.owner?.login;

    const repo =
        repository.name;


    if (
        !owner ||
        !repo
    ) {

        return null;
    }


    const [
        languages,
        readme,
        commits
    ] = await Promise.all([

        getRepositoryLanguages(
            owner,
            repo
        ),

        getRepositoryReadme(
            owner,
            repo
        ),

        getRepositoryCommits(
            owner,
            repo
        )
    ]);


    return {

        id:
            repository.id,

        name:
            repository.name,

        fullName:
            repository.full_name,

        description:
            repository.description,

        htmlUrl:
            repository.html_url,

        homepage:
            repository.homepage ||
            null,

        language:
            repository.language ||
            null,

        languages,

        topics:
            Array.isArray(
                repository.topics
            )
                ? repository.topics
                : [],

        stars:
            repository.stargazers_count ||
            0,

        forks:
            repository.forks_count ||
            0,

        watchers:
            repository.watchers_count ||
            0,

        openIssues:
            repository.open_issues_count ||
            0,

        size:
            repository.size ||
            0,

        defaultBranch:
            repository.default_branch ||
            "main",

        license:
            repository.license
                ? {
                    name:
                        repository
                            .license
                            .name ||
                        null,

                    spdxId:
                        repository
                            .license
                            .spdx_id ||
                        null
                }
                : null,

        createdAt:
            repository.created_at,

        updatedAt:
            repository.updated_at,

        pushedAt:
            repository.pushed_at,

        fork:
            Boolean(
                repository.fork
            ),

        archived:
            Boolean(
                repository.archived
            ),

        hasIssues:
            Boolean(
                repository.has_issues
            ),

        hasWiki:
            Boolean(
                repository.has_wiki
            ),

        hasPages:
            Boolean(
                repository.has_pages
            ),

        readme: {

            exists:
                readme.exists,

            name:
                readme.name,

            size:
                readme.size,

            content:
                readme.content,

            htmlUrl:
                readme.htmlUrl
        },

        recentCommits:
            commits.map(
                (commit) => ({

                    sha:
                        commit.sha,

                    message:
                        commit.commit
                            ?.message ||
                        "",

                    author:
                        commit.commit
                            ?.author
                            ?.name ||
                        null,

                    date:
                        commit.commit
                            ?.author
                            ?.date ||
                        null,

                    htmlUrl:
                        commit.html_url ||
                        null
                })
            )
    };
};


// ============================================================
// COMPLETE GITHUB DATA COLLECTION
// ============================================================
//
// This function is used by githubController.js.
//
// It collects:
// - Profile
// - Repositories
// - Public events
// - Repository languages
// - README
// - Recent commits
//
// Detailed analysis is limited to 20
// non-fork, non-archived repositories.
//

const collectGithubData = async (
    username
) => {

    // --------------------------------------------
    // Normalize username
    // --------------------------------------------

    const normalizedUsername =
        String(username || "")
            .trim()
            .replace(/^@/, "")
            .replace(
                /^https?:\/\/github\.com\//i,
                ""
            )
            .replace(
                /\/.*$/,
                ""
            );


    if (
        !normalizedUsername
    ) {

        throw new Error(
            "GitHub username is required."
        );
    }


    console.log(
        `Fetching GitHub profile: ${normalizedUsername}`
    );


    // --------------------------------------------
    // Fetch profile
    // --------------------------------------------

    const profile =
        await getGithubUser(
            normalizedUsername
        );


    // --------------------------------------------
    // Fetch repositories
    // --------------------------------------------

    const repositories =
        await getGithubRepositories(
            normalizedUsername
        );


    // --------------------------------------------
    // Fetch public events
    // --------------------------------------------

    const events =
        await getGithubEvents(
            normalizedUsername
        );


    // --------------------------------------------
    // Select repositories for detailed analysis
    // --------------------------------------------
    //
    // Ignore:
    // - Forked repositories
    // - Archived repositories
    //
    // Analyze maximum 20 repositories.
    //

    const selectedRepositories =
        repositories
            .filter(
                (repo) =>
                    !repo.fork &&
                    !repo.archived
            )
            .slice(0, 20);


    const repositoryData = [];


    // --------------------------------------------
    // Process repositories in batches
    // --------------------------------------------
    //
    // Each repository requires:
    // - Languages API
    // - README API
    // - Commits API
    //
    // Batch size = 4 to avoid sending
    // too many requests simultaneously.
    //

    const batchSize = 4;


    for (
        let index = 0;
        index <
        selectedRepositories.length;
        index += batchSize
    ) {

        const batch =
            selectedRepositories.slice(
                index,
                index + batchSize
            );


        const results =
            await Promise.all(
                batch.map(
                    (repository) =>
                        collectRepositoryData(
                            repository
                        )
                )
            );


        repositoryData.push(
            ...results.filter(Boolean)
        );
    }


    // --------------------------------------------
    // Return normalized GitHub data
    // --------------------------------------------

    return {

        profile: {

            login:
                profile.login,

            name:
                profile.name,

            avatarUrl:
                profile.avatar_url,

            htmlUrl:
                profile.html_url,

            bio:
                profile.bio,

            company:
                profile.company,

            location:
                profile.location,

            blog:
                profile.blog,

            twitterUsername:
                profile.twitter_username,

            publicRepos:
                profile.public_repos,

            publicGists:
                profile.public_gists,

            followers:
                profile.followers,

            following:
                profile.following,

            createdAt:
                profile.created_at,

            updatedAt:
                profile.updated_at
        },


        repositories:
            repositoryData,


        events:
            events.map(
                (event) => ({

                    id:
                        event.id,

                    type:
                        event.type,

                    repo:
                        event.repo
                            ?.name ||
                        null,

                    createdAt:
                        event.created_at
                })
            )
    };
};


// ============================================================
// EXPORTS
// ============================================================

module.exports = {

    getGithubUser,

    getGithubRepositories,

    getRepositoryLanguages,

    getRepositoryReadme,

    getRepository,

    getGithubEvents,

    getRepositoryCommits,

    collectRepositoryData,

    collectGithubData
};