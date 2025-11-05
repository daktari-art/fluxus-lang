// FILENAME: src/tutorial.js
// Fluxus Language Interactive Tutorial System - FIXED Exit Handling

import readline from 'readline';

export class FluxusTutorial {
    constructor() {
        this.currentLesson = 0;
        this.currentExercise = 0;
        this.rl = null;
        this.exiting = false;
        
        this.lessons = [
            {
                title: "🌊 Welcome to Fluxus",
                description: "Learn the basics of reactive stream programming",
                exercises: [
                    {
                        challenge: "Create a simple stream that adds 5 to 3",
                        solution: "~ 5 | add(3) | print()",
                        hint: "Start with ~, then use | to pipe through operators",
                        test: (input) => input.includes('~ 5 | add(3) | print()') || 
                                        input.includes('5 | add(3) | print()')
                    },
                    {
                        challenge: "Transform a string to uppercase",
                        solution: '~ "hello" | to_upper() | print()',
                        hint: "Strings work the same way as numbers in streams",
                        test: (input) => input.includes('"hello" | to_upper() | print()') || 
                                        input.includes("'hello' | to_upper() | print()")
                    }
                ]
            },
            {
                title: "🏊 Tidal Pools & State",
                description: "Learn how to manage reactive state with Tidal Pools",
                exercises: [
                    {
                        challenge: "Create a counter pool starting at 0",
                        solution: "let counter = <|> 0",
                        hint: "Use let name = <|> initial_value syntax",
                        test: (input) => input.includes('let') && input.includes('<|>') && input.includes('0')
                    },
                    {
                        challenge: "Update the counter to 10",
                        solution: "~ 10 | to_pool(counter)",
                        hint: "Use to_pool() operator to update pools",
                        test: (input) => input.includes('to_pool(counter)') && 
                                        (input.includes('~ 10') || input.includes('10 |'))
                    }
                ]
            }
        ];
    }

    start() {
        console.log('\n\x1b[1;36m🎓 Fluxus Interactive Tutorial\x1b[0m');
        console.log('Type .next to advance, .hint for help, .exit to quit tutorial\n');
        
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: 'tutorial> '
        });

        // Handle CTRL+C to exit gracefully
        this.rl.on('SIGINT', () => {
            this.exitTutorial();
        });

        this.showCurrentLesson();
        this.rl.prompt();

        this.rl.on('line', (input) => {
            if (this.exiting) return;
            this.handleInput(input.trim());
        });

        this.rl.on('close', () => {
            if (!this.exiting) {
                console.log('\n👋 Thanks for learning Fluxus!');
                process.exit(0);
            }
        });
    }

    showCurrentLesson() {
        if (this.exiting) return;
        
        const lesson = this.lessons[this.currentLesson];
        if (!lesson) {
            console.log('\x1b[32m🎉 Tutorial completed! You\'re now a Fluxus expert!\x1b[0m');
            this.exitTutorial();
            return;
        }

        console.log('\x1b[1;33m\n📚 Lesson ' + (this.currentLesson + 1) + ': ' + lesson.title + '\x1b[0m');
        console.log('\x1b[90m   ' + lesson.description + '\x1b[0m');
        
        const exercise = lesson.exercises[this.currentExercise];
        if (exercise) {
            console.log('\x1b[1;33m\n💪 Current Exercise:\x1b[0m');
            console.log('\x1b[36m   ' + exercise.challenge + '\x1b[0m');
            console.log('\x1b[90m   Type your solution below or use .hint for help\x1b[0m');
        } else {
            this.advanceLesson();
        }
    }

    handleInput(input) {
        if (this.exiting) return;

        if (input.startsWith('.')) {
            this.handleCommand(input);
            return;
        }

        if (input === '') {
            this.rl.prompt();
            return;
        }

        // Check if this is a solution attempt
        this.checkSolution(input);
    }

    handleCommand(cmd) {
        if (this.exiting) return;

        const lesson = this.lessons[this.currentLesson];
        const exercise = lesson ? lesson.exercises[this.currentExercise] : null;

        switch (cmd) {
            case '.next':
                if (exercise) {
                    console.log('\x1b[33m💡 Skipping exercise. Solution: ' + exercise.solution + '\x1b[0m');
                }
                this.advanceExercise();
                break;
                
            case '.prev':
                this.currentExercise = Math.max(0, this.currentExercise - 1);
                if (this.currentExercise === 0 && this.currentLesson > 0) {
                    this.currentLesson--;
                    this.currentExercise = this.lessons[this.currentLesson].exercises.length - 1;
                }
                this.showCurrentLesson();
                this.rl.prompt();
                break;
                
            case '.hint':
                if (exercise) {
                    console.log('\x1b[90m💡 Hint: ' + exercise.hint + '\x1b[0m');
                } else {
                    console.log('\x1b[31m❌ No current exercise\x1b[0m');
                }
                this.rl.prompt();
                break;
                
            case '.solution':
                if (exercise) {
                    console.log('\x1b[32m🔧 Solution: ' + exercise.solution + '\x1b[0m');
                } else {
                    console.log('\x1b[31m❌ No current exercise\x1b[0m');
                }
                this.rl.prompt();
                break;
                
            case '.exit':
            case '.quit':
                this.exitTutorial();
                return;
                
            case '.restart':
                this.currentLesson = 0;
                this.currentExercise = 0;
                this.showCurrentLesson();
                this.rl.prompt();
                break;
                
            case '.progress':
                this.showProgress();
                break;

            case '.help':
                this.showHelp();
                this.rl.prompt();
                break;
                
            default:
                console.log('\x1b[31m❌ Unknown tutorial command. Type .help for available commands\x1b[0m');
                this.showHelp();
                this.rl.prompt();
        }
    }

    showHelp() {
        console.log('\x1b[1;33m\n📖 Tutorial Commands:\x1b[0m');
        console.log('  .next      - Skip to next exercise');
        console.log('  .prev      - Go to previous exercise');
        console.log('  .hint      - Get a hint for current exercise');
        console.log('  .solution  - Show the solution');
        console.log('  .progress  - Show your progress');
        console.log('  .restart   - Restart the tutorial');
        console.log('  .exit      - Exit the tutorial (or press CTRL+C)');
        console.log('  .help      - Show this help');
    }

    checkSolution(input) {
        if (this.exiting) return;

        const lesson = this.lessons[this.currentLesson];
        const exercise = lesson ? lesson.exercises[this.currentExercise] : null;

        if (!exercise) {
            console.log('\x1b[31m❌ No current exercise\x1b[0m');
            this.rl.prompt();
            return;
        }

        if (exercise.test(input)) {
            console.log('\x1b[32m✅ Correct! Well done!\x1b[0m');
            setTimeout(() => {
                if (!this.exiting) {
                    this.advanceExercise();
                }
            }, 1000);
        } else {
            console.log('\x1b[31m❌ Not quite right. Try again or type .hint for help\x1b[0m');
            console.log('\x1b[90m   Your input: ' + input + '\x1b[0m');
            this.rl.prompt();
        }
    }

    advanceExercise() {
        if (this.exiting) return;

        const lesson = this.lessons[this.currentLesson];
        if (!lesson) return;

        this.currentExercise++;
        
        if (this.currentExercise >= lesson.exercises.length) {
            this.advanceLesson();
        } else {
            this.showCurrentLesson();
            this.rl.prompt();
        }
    }

    advanceLesson() {
        if (this.exiting) return;

        this.currentLesson++;
        this.currentExercise = 0;
        
        if (this.currentLesson >= this.lessons.length) {
            console.log('\x1b[32m🎉 Tutorial completed! You\'re now a Fluxus expert!\x1b[0m');
            setTimeout(() => {
                this.exitTutorial();
            }, 2000);
        } else {
            this.showCurrentLesson();
            this.rl.prompt();
        }
    }

    showProgress() {
        if (this.exiting) return;

        const totalExercises = this.lessons.reduce((sum, lesson) => sum + lesson.exercises.length, 0);
        let completedExercises = 0;
        
        for (let i = 0; i < this.currentLesson; i++) {
            completedExercises += this.lessons[i].exercises.length;
        }
        completedExercises += this.currentExercise;
        
        const progress = (completedExercises / totalExercises * 100).toFixed(1);
        
        console.log('\x1b[1;33m\n📊 Your Progress:\x1b[0m');
        console.log('\x1b[90m   Completed: ' + completedExercises + '/' + totalExercises + ' exercises\x1b[0m');
        console.log('\x1b[90m   Progress: ' + progress + '%\x1b[0m');
        console.log('\x1b[90m   Current: Lesson ' + (this.currentLesson + 1) + ', Exercise ' + (this.currentExercise + 1) + '\x1b[0m');
        
        this.rl.prompt();
    }

    exitTutorial() {
        if (this.exiting) return;
        
        this.exiting = true;
        console.log('\n\x1b[33m👋 Exiting tutorial. Return anytime with: npm run tutorial\x1b[0m');
        
        // Close the readline interface
        if (this.rl) {
            this.rl.close();
        }
        
        // Exit the process after a brief delay
        setTimeout(() => {
            process.exit(0);
        }, 100);
    }
}
