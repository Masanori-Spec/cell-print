import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./tests/browser',timeout:45000,fullyParallel:false,workers:1,retries:0,reporter:[['list'],['html',{open:'never'}]],use:{headless:true,viewport:{width:1365,height:900},launchOptions:{chromiumSandbox:true}}});
