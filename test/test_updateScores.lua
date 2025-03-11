#!/usr/bin/env lua

-- Load the Busted testing framework
local busted = require("busted")
local describe = busted.describe
local it = busted.it
local assert = require("luassert")
local mock = require("luassert.mock")
local spy = require("luassert.spy")

-- Mock the required modules
local yaml_mock = mock(require("lyaml"))
local io_mock = mock(io)

-- Create a test file system
local test_files = {
    ["votes.yaml"] = yaml_mock.dump({
        ["1"] = {
            title = "Successful Proposal",
            votes = {
                voter1 = "FOR",
                voter2 = "FOR",
                voter3 = "AGAINST",
            },
            processed = false,
        },
    }),
    ["scores.yaml"] = yaml_mock.dump({
        proposer = 5,
        voter1 = 2,
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
os.getenv = function(name)
    if name == "GITHUB_REPOSITORY" then
        return "test_owner/test_repo"
    elseif name == "GITHUB_TOKEN" then
        return "test_token"
    end
    return nil
end

describe("Update Scores", function()
    local updateScores

    setup(function()
        -- Load the module under test
        updateScores = require("../src/updateScores")
    end)

    before_each(function()
        -- Reset mocks
        yaml_mock.load.returns({
            ["1"] = {
                title = "Successful Proposal",
                votes = {
                    voter1 = "FOR",
                    voter2 = "FOR",
                    voter3 = "AGAINST",
                },
                processed = false,
            },
        })

        yaml_mock.load.when_called_with(test_files["scores.yaml"]).returns({
            proposer = 5,
            voter1 = 2,
        })
    end)

    it("should update scores for a successful proposal", function()
        -- Call the function
        updateScores.update_scores()

        -- Verify scores were updated correctly
        assert.spy(yaml_mock.dump).was.called_with({
            proposer = 8, -- 5 + 3 for successful proposal
            voter1 = 4, -- 2 + 2 for voting with majority
            voter2 = 2, -- 0 + 2 for voting with majority
            voter3 = 1, -- 0 + 1 for voting against majority
        })
    end)

    it("should handle missing scores file", function()
        -- Simulate missing scores file
        yaml_mock.load.when_called_with(test_files["scores.yaml"]).returns(nil)

        -- Call the function
        updateScores.update_scores()

        -- Verify new scores file was created
        assert.spy(yaml_mock.dump).was.called_with({
            proposer = 3, -- 0 + 3 for successful proposal
            voter1 = 2, -- 0 + 2 for voting with majority
            voter2 = 2, -- 0 + 2 for voting with majority
            voter3 = 1, -- 0 + 1 for voting against majority
        })
    end)

    it("should mark processed proposals", function()
        -- Call the function
        updateScores.update_scores()

        -- Verify votes were marked as processed
        assert.spy(yaml_mock.dump).was.called_with({
            ["1"] = {
                title = "Successful Proposal",
                votes = {
                    voter1 = "FOR",
                    voter2 = "FOR",
                    voter3 = "AGAINST",
                },
                processed = true,
            },
        })
    end)
end)
