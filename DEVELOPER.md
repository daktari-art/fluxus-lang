# 🚀 Fluxus Language - Developer Guide

## 🌟 Project Status: **Production Ready**

Fluxus is a fully functional reactive stream programming language with professional tooling, comprehensive documentation, and cross-platform support.

## 📁 Project Structure

```

fluxus-lang/
├──src/
│├── core/                 # Language Core
││   ├── parser.js        # AST Parser
││   ├── compiler.js      # Type Checking & Optimization
││   └── engine.js        # Runtime Engine
│├── repl.js              # Interactive REPL
│├── dashboard.js         # Web Dashboard
│├── profiler.js          # Performance Profiler
│├── tutorial.js          # Interactive Tutorial
│└── package-manager.js   # FLOW Package System
├──examples/                 # Example Programs
├──fluxus_packages/         # Installed Packages
├──*.md                     # Documentation
└──test-run.js             # Test Suite

```

## 🛠️ Development Workflow

### Local Development
```bash
# Start REPL for testing
npm run repl

# Run examples
npm run examples

# Start dashboard for monitoring
npm run dashboard

# Run tests
npm test
```

Global Installation (Termux/Desktop)

```bash
# Install globally
node install.js --global

# Use anywhere
fluxus repl
fluxus run examples/arithmetic.flux
fluxus tutorial
```

🔧 Core Features

1. Reactive Stream Engine

· Non-blocking stream execution
· Tidal Pools for state management
· Automatic reactive subscriptions

2. Professional Tooling

· Web Dashboard: Real-time monitoring at http://localhost:3000
· Performance Profiler: Identify bottlenecks
· Package Manager: Extend with FLOW libraries
· Interactive Tutorial: Learn Fluxus step-by-step

3. Cross-Platform Support

· ✅ Termux (Android) - Fully supported
· ✅ Linux/macOS - Fully supported
· ✅ Windows - Should work with Node.js

📦 Package Ecosystem

Available Packages

```bash
# Install packages
fluxus install http
fluxus install math
fluxus install utils

# List installed
fluxus list

# Search packages
fluxus search crypto
```

Package Types

· http: Network operations (fetch_url, websocket_stream)
· fs: File system operations
· crypto: Security functions
· math: Advanced mathematics
· time: Scheduling utilities
· utils: Common utilities

🎓 Learning Path

Beginner

1. Run fluxus tutorial for interactive lessons
2. Read GETTING_STARTED.md for basics
3. Experiment in REPL with examples

Intermediate

1. Study SPECIFICATION.md for language details
2. Create complex stream pipelines
3. Use dashboard for debugging

Advanced

1. Extend with custom FLOW packages
2. Use profiler for optimization
3. Integrate with external systems

🔍 Debugging & Optimization

Performance Profiling

```bash
# Run with profiling
fluxus profile examples/arithmetic.flux

# Monitor in dashboard
fluxus dashboard
```

Common Issues

· Stream not executing: Check if source starts with ~
· Pool not updating: Ensure to_pool() is used
· Syntax errors: Use multi-line for complex expressions

🌐 Web Dashboard

The dashboard provides real-time monitoring:

· Stream executions: Track all stream operations
· Pool values: Monitor Tidal Pool states
· Performance metrics: Memory usage, execution times
· System status: Engine health monitoring

Access: http://localhost:3000

📚 Documentation Hierarchy

1. SPECIFICATION.md - Language specification
2. GETTING_STARTED.md - Beginner tutorials
3. DEVELOPER.md - This guide (development workflow)
4. CONTRIBUTING.md - Community guidelines
5. ROADMAP.md - Future development plan

🚀 Production Readiness Checklist

· Core Language: Parser, compiler, engine working
· REPL: Interactive development environment
· Testing: Comprehensive test suite
· Documentation: Complete learning materials
· Tooling: Dashboard, profiler, package manager
· Packaging: Global and local installation
· Cross-Platform: Termux and desktop support
· Error Handling: Graceful error recovery

🤝 Contributing

Adding New Features

1. Follow reactive programming principles
2. Maintain cross-platform compatibility
3. Update documentation
4. Add tests

Package Development

1. Create in fluxus_packages/ directory
2. Implement standard operator interface
3. Document operators and usage
4. Test with various stream types

📞 Support

· Documentation: Check the *.md files
· Examples: Study examples/ directory
· REPL: Use .help command for built-in help
· Dashboard: Real-time monitoring and debugging

🎯 Vision Achieved

Fluxus has successfully created a reactive stream programming ecosystem that:

· Makes asynchronous programming intuitive
· Provides professional development tools
· Supports learning through interactive tutorial
· Works across platforms (including mobile)
· Maintains clean, documented codebase

## 🎯 Recommended Workflow (Most Reliable)

For the most reliable experience, use local npm scripts:

```bash
# Development and testing
npm run repl              # Interactive REPL
npm run examples          # Run all examples  
npm run dashboard         # Web dashboard
npm run tutorial          # Interactive learning

# Package management
npm run install-pkg http  # Install packages
npm run list-pkgs         # List installed

# Testing and profiling
npm test                  # Run test suite
npm run profile           # Performance profiling
```

Global Commands (Optional)

Global commands are available but may require path configuration:

```bash
# If global installation works:
fluxus repl
fluxus run examples/hello.flux
fluxus tutorial

# If global commands fail, use local equivalents:
node src/cli.js repl
node src/cli.js run examples/hello.flux  
node src/cli.js tutorial
```
The local workflow is guaranteed to work and is recommended for development.


The project foundation is solid and ready for production use and community growth! 🚀

