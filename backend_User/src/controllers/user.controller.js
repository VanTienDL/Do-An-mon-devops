const User = require('../models/user.model');

exports.getAllUsers = async (req, res) => {
  const users = await User.getAll();
  res.json(users);
};

exports.getUserById = async (req, res) => {
  const user = await User.getById(req.params.id);
  res.json(user);
};

exports.createUser = async (req, res) => {
  const { name, email, password } = req.body;
  const newUser = await User.create(name, email, password);
  res.status(201).json(newUser);
};

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.checkLogin(email, password);
  res.json(user);
};

exports.deleteUser = async (req, res) => {
  await User.delete(req.params.id);
  res.json({ message: 'User deleted' });
};