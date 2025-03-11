#!/usr/bin/env lua

-- Load the Busted testing framework
local busted = require("busted")
local describe = busted.describe
local it = busted.it
local assert = require("luassert")
local mock = require("luassert.mock")
local spy = require("luassert.spy")

-- Mock the required modules
local json_mock = mock(require("cjson"))
local yaml_mock = mock(require("lyaml"))
local io_mock = mock(io)
local os_mock = mock(os)

-- Create a test file system
local test_files = {
    ["votes.yaml"] = yaml_mock.dump({
        ["2"] = {
            title = "Old Proposal",
            votes = {},
        },
    }),
}

-- Mock io.open to return our test files
io_mock.open = function(path, mode)
    if mode == "r" and test_files[path] then
        return {
            read = function()
                return test_files[path]
            end,
            close = function() end,
        }
    elseif mode == "w" then
        return {
            write = function(_, content)
                test_files[path] = content
            end,
            close = function() end,
        }
    else
        return nil
    end
end

-- Set up environment variables for testing
os_mock.getenv = function(name)
    if name == "GITHUB_EVENT_PATH" then
        return "github_event.json"
    elseif name == "GITHUB_TOKEN" then
        return "test_token"
    end
    return nil
end

-- Create a test GitHub event
test_files["github_event.json"] = json_mock.encode({
    issue = {
        number = 3,
        title = "Test Proposal",
    },
    repository = {
        owner = {
            login = "test_owner",
        },
        name = "test_repo",
    },
})

describe("Track Votes", function()
    local trackVotes

    setup(function()
        -- Load the module under test
        trackVotes = require("../src/trackVotes")
    end)

    before_each(function()
        -- Reset mocks
        json_mock.decode.returns({
            issue = {
                number = 3,
                title = "Test Proposal",
            },
            repository = {
                owner = {
                    login = "test_owner",
                },
                name = "test_repo",
            },
        })

        yaml_mock.load.returns({
            ["2"] = {
                title = "Old Proposal",
                votes = {},
            },
        })
    end)

    it("should process votes from comments", function()
        -- Call the function
        trackVotes.process_votes()

        -- Verify votes were saved
        assert.spy(yaml_mock.dump).was.called_with({
            ["2"] = {
                title = "Old Proposal",
                votes = {},
            },
            ["3"] = {
                title = "Test Proposal",
                votes = {
                    user1 = "FOR",
                    user2 = "AGAINST",
                },
                updated = spy.match(function(val)
                    return type(val) == "string"
                end),
            },
        })
    end)

    it("should handle missing votes file", function()
        -- Simulate missing votes file
        yaml_mock.load.returns(nil)

        -- Call the function
        trackVotes.process_votes()

        -- Verify new votes file was created
        assert.spy(yaml_mock.dump).was.called()
    end)
end)
