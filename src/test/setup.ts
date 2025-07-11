// Test setup file
import { jest } from "@jest/globals";

// Mock console methods to reduce noise in tests
global.console = {
	...console,
	log: jest.fn(),
	debug: jest.fn(),
	info: jest.fn(),
	warn: jest.fn(),
	error: jest.fn(),
};

// Mock environment variables
process.env.GITHUB_TOKEN = "test-token";
process.env.GITHUB_REPOSITORY = "test-owner/test-repo";
process.env.GITHUB_EVENT_PATH = "/tmp/test-event.json";
process.env.GITHUB_EVENT_NAME = "issue_comment";
