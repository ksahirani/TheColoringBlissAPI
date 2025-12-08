const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const Category = require('./models/Category');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/notebook_store');
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const addCategories = async () => {
  try {
    console.log('Adding new categories (keeping existing ones)...\n');

    // Helper function to create category if it doesn't exist
    const createIfNotExists = async (categoryData) => {
      const existing = await Category.findOne({ name: categoryData.name });
      if (existing) {
        console.log(`⏭️  Skipped (already exists): ${categoryData.name}`);
        return existing;
      }
      const created = await Category.create(categoryData);
      console.log(`✅ Created: ${categoryData.name}`);
      return created;
    };

    // Create parent categories first
    const plannersCat = await createIfNotExists({
      name: 'Planners',
      description: 'Stay organized with our premium planners',
      displayOrder: 1
    });

    const notepadsCat = await createIfNotExists({
      name: 'Notepads',
      description: 'Quick notes and memos made easy',
      displayOrder: 2
    });

    const notebooksCat = await createIfNotExists({
      name: 'Notebooks',
      description: 'Premium quality notebooks for all your writing needs',
      displayOrder: 3
    });

    console.log('\n--- Adding Planner subcategories ---');
    // Create Planner subcategories
    await createIfNotExists({
      name: 'Weekly Planner',
      description: 'Plan your week ahead with our weekly planners',
      displayOrder: 4,
      parent: plannersCat._id
    });
    await createIfNotExists({
      name: 'Daily Planner',
      description: 'Organize your day with our daily planners',
      displayOrder: 5,
      parent: plannersCat._id
    });
    await createIfNotExists({
      name: 'Monthly Planner',
      description: 'Keep track of your monthly goals and events',
      displayOrder: 6,
      parent: plannersCat._id
    });
    await createIfNotExists({
      name: 'Yearly Planner',
      description: 'Plan your entire year with our yearly planners',
      displayOrder: 7,
      parent: plannersCat._id
    });

    console.log('\n--- Adding Notepad subcategories ---');
    // Create Notepad subcategories
    await createIfNotExists({
      name: 'Tearable Notes',
      description: 'Easy tear-off notepads for quick notes',
      displayOrder: 8,
      parent: notepadsCat._id
    });
    await createIfNotExists({
      name: 'Sticky Notes',
      description: 'Colorful sticky notes for reminders',
      displayOrder: 9,
      parent: notepadsCat._id
    });
    await createIfNotExists({
      name: 'Loose Notes',
      description: 'Loose leaf notes for flexible note-taking',
      displayOrder: 10,
      parent: notepadsCat._id
    });

    console.log('\n--- Adding Notebook subcategories ---');
    // Create Notebook subcategories
    await createIfNotExists({
      name: 'Writing Notebook - Grade 1 and 2',
      description: 'Writing notebooks designed for Grade 1 and 2 students',
      displayOrder: 11,
      parent: notebooksCat._id
    });
    await createIfNotExists({
      name: 'Writing Notebook - Grade 3',
      description: 'Writing notebooks designed for Grade 3 students',
      displayOrder: 12,
      parent: notebooksCat._id
    });
    await createIfNotExists({
      name: 'Composition Notebook',
      description: 'Classic composition notebooks for school and work',
      displayOrder: 13,
      parent: notebooksCat._id
    });
    await createIfNotExists({
      name: 'Notebook Inserts',
      description: 'Refill inserts for your favorite notebooks',
      displayOrder: 14,
      parent: notebooksCat._id
    });

    console.log('\n========================================');
    console.log('✅ Categories setup complete!');
    console.log('========================================');
    console.log('\nYour category structure:');
    console.log('├── Planners');
    console.log('│   ├── Weekly Planner');
    console.log('│   ├── Daily Planner');
    console.log('│   ├── Monthly Planner');
    console.log('│   └── Yearly Planner');
    console.log('├── Notepads');
    console.log('│   ├── Tearable Notes');
    console.log('│   ├── Sticky Notes');
    console.log('│   └── Loose Notes');
    console.log('└── Notebooks');
    console.log('    ├── Writing Notebook - Grade 1 and 2');
    console.log('    ├── Writing Notebook - Grade 3');
    console.log('    ├── Composition Notebook');
    console.log('    └── Notebook Inserts');

  } catch (error) {
    console.error('Error creating categories:', error);
  } finally {
    mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
};

connectDB().then(() => {
  addCategories();
});