"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const github = __importStar(require("@actions/github"));
const core = __importStar(require("@actions/core"));
const exec = __importStar(require("@actions/exec"));
const io = __importStar(require("@actions/io"));
const path = __importStar(require("path"));
const index_1 = __importDefault(require("../index"));
const originalContext = { ...github.context };
const originalGitHubWorkspace = process.env['GITHUB_WORKSPACE'];
const gitHubWorkspace = path.resolve('/checkout-tests/workspace');
let inputs = {};
let execSpy;
beforeAll(() => {
    execSpy = jest.spyOn(exec, 'exec').mockImplementation(jest.fn());
    jest.spyOn(io, 'cp').mockImplementation(jest.fn());
    jest.spyOn(core, 'getInput').mockImplementation((name) => {
        return inputs[name];
    });
    jest.spyOn(github.context, 'repo', 'get').mockImplementation(() => {
        return {
            owner: 'foo',
            repo: 'foo.github.io',
        };
    });
    github.context.ref = 'refs/heads/some-ref';
    github.context.sha = '1234567890123456789012345678901234567890';
    process.env['GITHUB_WORKSPACE'] = gitHubWorkspace;
});
afterAll(() => {
    delete process.env['GITHUB_WORKSPACE'];
    if (originalGitHubWorkspace) {
        process.env['GITHUB_WORKSPACE'] = originalGitHubWorkspace;
    }
    github.context.ref = originalContext.ref;
    github.context.sha = originalContext.sha;
    jest.restoreAllMocks();
});
beforeEach(() => {
    jest.resetModules();
    inputs = {
        'access-token': 'SECRET',
    };
});
describe('scully Publish action', () => {
    it('returns an error when no access token is given', async () => {
        inputs['access-token'] = '';
        const setFailedSpy = jest.spyOn(core, 'setFailed');
        await index_1.default();
        expect(setFailedSpy).toBeCalledWith('No personal access token found. Please provide one by setting the `access-token` input for this action.');
    });
    it('skips if deploy branch is the same as the current git head', async () => {
        inputs['deploy-branch'] = 'some-ref';
        github.context.ref = 'refs/heads/some-ref';
        await expect(index_1.default()).resolves.not.toThrowError();
    });
    it('calls angular build without args', async () => {
        inputs['build-args'] = '';
        inputs['scully-args'] = '';
        await index_1.default();
        expect(execSpy).toHaveBeenLastCalledWith('yarn run build ', []);
    });
    it('calls angular build with args', async () => {
        inputs['build-args'] = '--prefix-paths --no-uglify';
        inputs['scully-args'] = '';
        await index_1.default();
        expect(execSpy).toHaveBeenLastCalledWith('yarn run build -- --prefix-paths --no-uglify', []);
    });
});
