package = "nomic-voting"
version = "1.0-1"
source = {
   url = "git://github.com/mburns/nomic",
   tag = "v1.0"
}
description = {
   summary = "A voting system for Nomic games",
   detailed = [[
      This package provides a voting system for Nomic games.
      It tracks votes on proposals and updates player scores based on the outcomes.
   ]],
   homepage = "https://github.com/mburns/nomic",
   license = "MIT"
}
dependencies = {
   "lua >= 5.4",
   "lua-cjson >= 2.1.0",
   "lyaml >= 6.2.8",
   "luafilesystem >= 1.8.0"
}
build = {
   type = "builtin",
   modules = {
      ["nomic.trackVotes"] = "src/trackVotes.lua",
      ["nomic.updateScores"] = "src/updateScores.lua"
   }
}
test_dependencies = {
   "busted >= 2.1.1",
   "luacov >= 0.15.0",
   "luacheck >= 1.1.0",
   "luassert >= 1.9.0"
}
test = {
   type = "busted",
} 