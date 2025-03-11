-- Luacheck configuration file

-- Global objects defined by the environment
globals = {
    "os",
    "io",
    "string",
    "math",
    "table"
}

-- Allow unused self arguments in methods
self = false

-- Exclude third-party modules from checks
exclude_files = {
    "lua_modules/",
    ".luarocks/"
}

-- Ignore specific warnings
ignore = {
    "212", -- Unused argument
    "213", -- Unused loop variable
}

-- Maximum line length
max_line_length = 100

-- Maximum cyclomatic complexity
max_cyclomatic_complexity = 15

-- Files to include in checks
include_files = {
    "src/",
    "test/"
}

-- Specific file configurations
files["test/*"] = {
    -- Allow global test framework functions in test files
    globals = {
        "describe",
        "it",
        "setup",
        "teardown",
        "before_each",
        "after_each",
        "spy",
        "mock",
        "assert"
    }
} 