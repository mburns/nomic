#!/usr/bin/env lua

-- Required libraries
local json = require("cjson")
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
    if endpoint == "issues.listComments" then
        -- Validate required parameters
        if not params.owner or not params.repo or not params.issue_number then
            return nil, "Missing required parameters"
        end

        return {
            data = {
                {
                    body = "VOTE: FOR",
                    user = { login = "user1" },
                },
                {
                    body = "VOTE: AGAINST",
                    user = { login = "user2" },
                },
                {
                    body = "Just a comment",
                    user = { login = "user3" },
                },
            },
        }
    end
    return nil, "Unknown endpoint"
end

-- Load and validate GitHub context
local function load_github_context()
    local github_event_path = os.getenv("GITHUB_EVENT_PATH")
    if not github_event_path then
        error("GITHUB_EVENT_PATH environment variable not set")
    end
    
    local content, read_err = read_file(github_event_path)
    if not content then
        error("Failed to read GitHub event file: " .. tostring(read_err))
    end
    
    local ok, decoded = pcall(json.decode, content)
    if not ok then
        error("Failed to parse GitHub event JSON: " .. tostring(decoded))
    end

    -- Validate context
    if not decoded.issue or not decoded.issue.number then
        error("Missing issue number in GitHub context")
    end
    
    if not decoded.repository or not decoded.repository.owner or not decoded.repository.owner.login then
        error("Missing repository owner in GitHub context")
    end
    
    if not decoded.repository.name then
        error("Missing repository name in GitHub context")
    end

    return decoded
end

-- Load current votes state
local function load_votes()
    local votes = {}
    local votes_content = read_file("votes.yaml")
    if votes_content then
        local yaml_ok, parsed = pcall(yaml.load, votes_content)
        if not yaml_ok then
            error("Failed to parse votes YAML: " .. tostring(parsed))
        end
        votes = parsed
    end
    return votes
end

-- Process a single comment for voting
local function process_comment(comment)
    if type(comment.body) ~= "string" then
        return nil
    end
    
    local vote_match = string.match(comment.body:upper(), "^VOTE:%s*(%w+)")
    if not vote_match then
        return nil
    end
    
    local vote = string.upper(vote_match)
    if vote ~= "FOR" and vote ~= "AGAINST" then
        return nil
    end
    
    if not comment.user or not comment.user.login then
        return nil
    end
    
    return comment.user.login, vote
end

-- Main function to process votes
local function process_votes()
    -- Load and validate context
    local context = load_github_context()

    -- Load current votes state
    local votes = load_votes()

    -- Get all comments on the issue
    local comments_response, api_err = github_api_request("issues.listComments", {
        owner = context.repository.owner.login,
        repo = context.repository.name,
        issue_number = context.issue.number
    })
    
    if not comments_response or not comments_response.data then
        error("Failed to get issue comments: " .. tostring(api_err))
    end

    -- Process votes from comments
    local current_votes = {}
    for _, comment in ipairs(comments_response.data) do
        local voter, vote = process_comment(comment)
        if voter and vote then
            current_votes[voter] = vote
        end
    end

    -- Update votes for this issue
    votes[tostring(context.issue.number)] = {
        title = context.issue.title,
        votes = current_votes,
        updated = os.date("!%Y-%m-%dT%H:%M:%SZ")
    }

    -- Save updated votes
    write_file("votes.yaml", yaml.dump(votes))
end

-- Execute the main function
local status, err = pcall(process_votes)
if not status then
    io.stderr:write("Error processing votes: " .. tostring(err) .. "\n")
    os.exit(1)
end

-- Export functions for testing
return {
    process_votes = process_votes,
    read_file = read_file,
    write_file = write_file,
    github_api_request = github_api_request,
    -- Export internal functions for testing
    load_github_context = load_github_context,
    load_votes = load_votes,
    process_comment = process_comment
}
