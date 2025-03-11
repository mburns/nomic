#!/usr/bin/env lua

-- Required libraries
local yaml = require("lyaml")

-- Function to read a file
local function read_file(path)
    if not path then
        return nil, "No path provided"
    end
    local file, err = io.open(path, "r")
    if not file then
        return nil, "Could not open file: " .. tostring(err)
    end
    local content = file:read("*all")
    file:close()
    if not content then
        return nil, "Could not read file contents"
    end
    return content
end

-- Function to write to a file with backup
local function write_file(path, content)
    if not path or not content then
        error("Path and content are required")
    end

    -- Create backup if file exists
    local backup_content = read_file(path)
    if backup_content then
        local backup_path = path .. ".bak"
        local backup_file = io.open(backup_path, "w")
        if backup_file then
            backup_file:write(backup_content)
            backup_file:close()
        end
    end

    local file, err = io.open(path, "w")
    if not file then
        error("Could not open file for writing: " .. tostring(err))
    end
    file:write(content)
    file:close()
end

-- Function to make HTTP requests (simplified, would need a real HTTP library)
local function github_api_request(endpoint, params)
    if not endpoint or not params then
        return nil, "Missing endpoint or params"
    end

    -- In a real implementation, this would use an HTTP library like luasocket
    -- For now, we'll simulate the response for testing
    if endpoint == "issues.get" then
        -- Validate required parameters
        if not params.owner or not params.repo or not params.issue_number then
            return nil, "Missing required parameters"
        end

        return {
            data = {
                user = { login = "proposer" },
            },
        }
    end
    return nil, "Unknown endpoint"
end

-- Count values in a table
local function count_values(tbl)
    if type(tbl) ~= "table" then
        return 0
    end
    local count = 0
    for _ in pairs(tbl) do
        count = count + 1
    end
    return count
end

-- Count specific values in a table
local function count_specific_values(tbl, value)
    if type(tbl) ~= "table" then
        return 0
    end
    local count = 0
    for _, v in pairs(tbl) do
        if v == value then
            count = count + 1
        end
    end
    return count
end

-- Load and validate scores
local function load_scores()
    local scores = {}
    local scores_content = read_file("scores.yaml")
    if scores_content then
        local ok, parsed = pcall(yaml.load, scores_content)
        if not ok then
            error("Failed to parse scores YAML: " .. tostring(parsed))
        end
        scores = parsed
    end
    return scores
end

-- Load and validate votes
local function load_votes()
    local votes_content, read_err = read_file("votes.yaml")
    if not votes_content then
        error("Failed to read votes file: " .. tostring(read_err))
    end
    local ok, votes = pcall(yaml.load, votes_content)
    if not ok then
        error("Failed to parse votes YAML: " .. tostring(votes))
    end
    if type(votes) ~= "table" then
        error("Invalid votes data structure")
    end
    return votes
end

-- Get repository information
local function get_repo_info()
    local github_repo = os.getenv("GITHUB_REPOSITORY")
    if not github_repo then
        error("GITHUB_REPOSITORY environment variable not set")
    end
    local owner, repo = string.match(github_repo, "([^/]+)/([^/]+)")
    if not owner or not repo then
        error("Invalid repository format: " .. github_repo)
    end
    return owner, repo
end

-- Get proposer for an issue
local function get_proposer(owner, repo, issue_number)
    local response, api_err = github_api_request("issues.get", {
        owner = owner,
        repo = repo,
        issue_number = tonumber(issue_number)
    })
    if not response or not response.data then
        error("Failed to get issue data: " .. tostring(api_err))
    end
    if not response.data.user or not response.data.user.login then
        error("Missing proposer information for issue " .. issue_number)
    end
    return response.data.user.login
end

-- Award points for a successful proposal
local function award_points_success(scores, proposer, voters)
    -- Points for proposer
    if not scores[proposer] then
        scores[proposer] = 0
    end
    scores[proposer] = scores[proposer] + 3 -- Points for successful proposal
    -- Points for voters
    for voter, vote in pairs(voters) do
        if not scores[voter] then
            scores[voter] = 0
        end
        if vote == "FOR" then
            scores[voter] = scores[voter] + 2 -- More points for voting with majority
        else
            scores[voter] = scores[voter] + 1 -- Point for participating
        end
    end
end

-- Award points for a failed proposal
local function award_points_failure(scores, proposer, voters)
    -- Points for proposer
    if not scores[proposer] then
        scores[proposer] = 0
    end
    scores[proposer] = scores[proposer] + 1 -- Point for participating
    -- Points for voters
    for voter, vote in pairs(voters) do
        if not scores[voter] then
            scores[voter] = 0
        end
        if vote == "AGAINST" then
            scores[voter] = scores[voter] + 2 -- More points for voting with majority
        else
            scores[voter] = scores[voter] + 1 -- Point for participating
        end
    end
end

-- Process a single issue's votes
local function process_issue(issue_number, issue_data, scores, owner, repo)
    -- Validate issue data
    if type(issue_data) ~= "table" or type(issue_data.votes) ~= "table" then
        error("Invalid issue data structure for issue " .. tostring(issue_number))
    end
    -- Skip if already processed
    if issue_data.processed then
        return false
    end
    local total_votes = count_values(issue_data.votes)
    if total_votes == 0 then
        return false
    end
    local for_votes = count_specific_values(issue_data.votes, "FOR")
    local passed = for_votes > total_votes / 2
    local proposer = get_proposer(owner, repo, issue_number)
    if passed then
        award_points_success(scores, proposer, issue_data.votes)
    else
        award_points_failure(scores, proposer, issue_data.votes)
    end
    return true
end

-- Main function to update scores
local function update_scores()
    local scores = load_scores()
    local votes = load_votes()
    local owner, repo = get_repo_info()
    -- Process each issue's votes
    for issue_number, issue_data in pairs(votes) do
        local processed = process_issue(issue_number, issue_data, scores, owner, repo)
        if processed then
            votes[issue_number].processed = true
        end
    end
    -- Save updated scores and votes
    write_file("scores.yaml", yaml.dump(scores))
    write_file("votes.yaml", yaml.dump(votes))
end

-- Execute the main function
local status, err = pcall(update_scores)
if not status then
    io.stderr:write("Error updating scores: " .. tostring(err) .. "\n")
    os.exit(1)
end

-- Export functions for testing
return {
    update_scores = update_scores,
    read_file = read_file,
    write_file = write_file,
    github_api_request = github_api_request,
    count_values = count_values,
    count_specific_values = count_specific_values,
    -- Export internal functions for testing
    load_scores = load_scores,
    load_votes = load_votes,
    get_repo_info = get_repo_info,
    get_proposer = get_proposer,
    award_points_success = award_points_success,
    award_points_failure = award_points_failure,
    process_issue = process_issue
}
