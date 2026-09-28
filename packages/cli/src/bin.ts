#!/usr/bin/env node
import { run } from './index.js';

const code = run(process.argv.slice(2));
if (typeof code === 'number') process.exitCode = code;
else
  void code.then((c) => {
    process.exitCode = c;
  });
