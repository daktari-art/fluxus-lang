// FILENAME: src/exit_helper.js
// Emergency Exit Helper for Fluxus Tutorial

console.log('\n🚨 EMERGENCY EXIT ACTIVATED');
console.log('If you are stuck in the tutorial, this will help you exit.\n');

console.log('Normal exit methods:');
console.log('  - Type .exit or .quit in the tutorial');
console.log('  - Press CTRL+C');
console.log('  - Close the terminal window\n');

console.log('If those don\'t work, try these keyboard shortcuts:');
console.log('  - CTRL+D (EOF - End of File)');
console.log('  - CTRL+Z (Suspend process, then type "kill %1")');
console.log('  - Close the terminal tab/window and reopen\n');

console.log('The tutorial should now exit automatically...');

// Try to simulate an exit
process.stdin.pause();
setTimeout(() => {
    console.log('Exiting now...');
    process.exit(0);
}, 1000);
