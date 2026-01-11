#!/usr/bin/env node

/**
 * Generate PR Description from TODO Files
 * 
 * This script reads TODO files from the docs/todos folder and generates
 * a PR description based on the changes between the latest TODO file and
 * the previous one, or from a single TODO file.
 */

const fs = require('fs');
const path = require('path');

const TODOS_DIR = __dirname;

function getAllTodoFiles() {
  if (!fs.existsSync(TODOS_DIR)) {
    console.error('TODO directory does not exist:', TODOS_DIR);
    process.exit(1);
  }

  const files = fs.readdirSync(TODOS_DIR)
    .filter(file => file.startsWith('todo_') && file.endsWith('.md'))
    .map(file => ({
      name: file,
      path: path.join(TODOS_DIR, file),
      timestamp: extractTimestamp(file)
    }))
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  return files;
}

function extractTimestamp(filename) {
  const match = filename.match(/todo_(\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2})\.md/);
  return match ? match[1] : '';
}

function parseTodoFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  const sections = {};
  let currentSection = null;
  
  lines.forEach(line => {
    const sectionMatch = line.match(/^##?\s+(.+)$/);
    if (sectionMatch) {
      currentSection = sectionMatch[1];
      sections[currentSection] = [];
    } else if (currentSection && line.trim()) {
      sections[currentSection].push(line);
    }
  });
  
  return sections;
}

function extractCompletedTasks(sections) {
  const completed = [];
  const pending = [];
  
  Object.entries(sections).forEach(([section, items]) => {
    items.forEach(item => {
      if (item.includes('✅')) {
        completed.push({ section, task: item.replace('✅', '').trim() });
      } else if (item.trim().startsWith('-')) {
        pending.push({ section, task: item.replace(/^-\s*/, '').trim() });
      }
    });
  });
  
  return { completed, pending };
}

function generatePRDescription(latestFile, previousFile = null) {
  const latest = parseTodoFile(latestFile.path);
  const { completed, pending } = extractCompletedTasks(latest);
  
  let description = `# Pull Request Description\n\n`;
  description += `Generated from TODO file: ${latestFile.name}\n\n`;
  
  if (previousFile) {
    const previous = parseTodoFile(previousFile.path);
    const prevCompleted = extractCompletedTasks(previous).completed;
    
    // Find new completions
    const newCompletions = completed.filter(
      item => !prevCompleted.some(prev => 
        prev.section === item.section && prev.task === item.task
      )
    );
    
    if (newCompletions.length > 0) {
      description += `## ✅ Completed Tasks\n\n`;
      const bySection = {};
      newCompletions.forEach(item => {
        if (!bySection[item.section]) bySection[item.section] = [];
        bySection[item.section].push(item.task);
      });
      
      Object.entries(bySection).forEach(([section, tasks]) => {
        description += `### ${section}\n\n`;
        tasks.forEach(task => {
          description += `- ✅ ${task}\n`;
        });
        description += '\n';
      });
    }
  } else {
    if (completed.length > 0) {
      description += `## ✅ Completed Tasks\n\n`;
      const bySection = {};
      completed.forEach(item => {
        if (!bySection[item.section]) bySection[item.section] = [];
        bySection[item.section].push(item.task);
      });
      
      Object.entries(bySection).forEach(([section, tasks]) => {
        description += `### ${section}\n\n`;
        tasks.forEach(task => {
          description += `- ✅ ${task}\n`;
        });
        description += '\n';
      });
    }
  }
  
  if (pending.length > 0) {
    description += `## 📋 Pending Tasks\n\n`;
    const bySection = {};
    pending.forEach(item => {
      if (!bySection[item.section]) bySection[item.section] = [];
      bySection[item.section].push(item.task);
    });
    
    Object.entries(bySection).forEach(([section, tasks]) => {
      description += `### ${section}\n\n`;
      tasks.forEach(task => {
        description += `- ${task}\n`;
      });
      description += '\n';
    });
  }
  
  description += `---\n\n`;
  description += `*This PR description was automatically generated from TODO files.*\n`;
  
  return description;
}

function main() {
  const files = getAllTodoFiles();
  
  if (files.length === 0) {
    console.error('No TODO files found');
    process.exit(1);
  }
  
  const latest = files[0];
  const previous = files.length > 1 ? files[1] : null;
  
  const prDescription = generatePRDescription(latest, previous);
  
  const outputPath = path.join(__dirname, '..', '..', 'PR_DESCRIPTION.md');
  fs.writeFileSync(outputPath, prDescription, 'utf-8');
  
  console.log('PR description generated:', outputPath);
  console.log('\n' + prDescription);
}

if (require.main === module) {
  main();
}

module.exports = { generatePRDescription, getAllTodoFiles, parseTodoFile };
