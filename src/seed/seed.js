/* Seeds a few demo accounts and a sample conversation so the mobile app has
   something to show on first run.

   Usage: npm run seed
   All demo accounts share the password: password123
*/
import mongoose from 'mongoose';
import { connectDatabase } from '../config/database.js';
import { User } from '../models/user.model.js';
import { Conversation } from '../models/conversation.model.js';
import { Message } from '../models/message.model.js';
import { logger } from '../utils/logger.js';

const DEMO_PASSWORD = 'password123';

const demoUsers = [
  { name: 'Alice Johnson', email: 'alice@chat.dev' },
  { name: 'Bob Smith', email: 'bob@chat.dev' },
  { name: 'Carol Williams', email: 'carol@chat.dev' },
];

const run = async () => {
  await connectDatabase();

  logger.info('Clearing existing data...');
  await Promise.all([
    User.deleteMany({}),
    Conversation.deleteMany({}),
    Message.deleteMany({}),
  ]);

  logger.info('Creating demo users...');
  const users = [];
  for (const data of demoUsers) {
    // Use create() (not insertMany) so the password-hashing hook runs.
    const user = await User.create({ ...data, password: DEMO_PASSWORD });
    users.push(user);
  }

  const [alice, bob] = users;

  logger.info('Creating a sample conversation...');
  const conversation = await Conversation.create({
    participants: [alice.id, bob.id],
  });

  const seededMessages = [
    { sender: alice.id, text: 'Hey Bob, welcome to the chat app! 👋' },
    { sender: bob.id, text: 'Thanks Alice! This looks great.' },
    { sender: alice.id, text: 'Try sending a message — it updates in real time.' },
  ];

  let last = null;
  for (const m of seededMessages) {
    last = await Message.create({
      conversation: conversation.id,
      sender: m.sender,
      text: m.text,
      readBy: [m.sender],
    });
  }

  conversation.lastMessage = last.id;
  conversation.lastMessageAt = last.createdAt;
  await conversation.save();

  logger.info('Seed complete. Demo accounts (password: password123):');
  demoUsers.forEach((u) => logger.info(`  - ${u.email}`));

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((error) => {
  logger.error(`Seed failed: ${error.message}`);
  process.exit(1);
});
