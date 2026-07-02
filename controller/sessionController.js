const Session = require("../models/Session");
const Question = require("../models/Question");

//@desc Create a new session and linked questions
// @route POST/api/sessions/create
// @access Private

exports.createSession = async (req, res) => {
  try {
    const { role, experience, topicsToFocus, description, questions } =
      req.body;
    const userId = req.user._id; //Assuming you have a middleware setting req.user

    if (!role || !experience || !topicsToFocus || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ success: false, message: "Role, experience, topics and questions are required" });
    }

    const validQuestions = questions.filter(
      (q) => q?.question?.trim() && q?.answer?.trim()
    );

    if (validQuestions.length === 0) {
      return res.status(400).json({ success: false, message: "At least one valid question and answer is required" });
    }

    const session = await Session.create({
      user: userId,
      role: role.trim(),
      experience,
      topicsToFocus: topicsToFocus.trim(),
      description: description?.trim() || "",
    });

    const questionDocs = await Promise.all(
      validQuestions.map(async (q) => {
        const question = await Question.create({
          session: session._id,
          question: q.question.trim(),
          answer: q.answer.trim(),
        });
        return question._id;
      })
    );
    session.questions = questionDocs;
    await session.save();
    res.status(201).json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

//@desc Get all session for logged-in user
// @route GET/api/sessions/my-sessions
// @access Private

exports.getMySessions = async (req, res) => {
  try {
    //console.log("User from token:", req.user);
    const sessions = await Session.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .populate("questions");
    res.status(200).json({ success: true, sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

//@desc Get a session by ID with populated questions
// @route GET/api/sessions/:id
// @access Private

exports.getSessionById = async (req, res) => {
  try {
    const session = await Session.findOne({
      _id: req.params.id,
      user: req.user.id,
    })
      .populate({
        path: "questions",
        options: { sort: { isPinned: -1, createdAt: 1 } },
      })
      .exec();
    if (!session) {
      return res
        .status(404)
        .json({ success: false, message: "Session not found" });
    }
    return res.status(200).json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

//@desc Delete a session and its questions
// @route DELETE/api/sessions/:id
// @access Private

exports.deleteSession = async (req, res) => {
  try {
    const session = await Session.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    //First delete all questions linked to this session
    await Question.deleteMany({ session: session._id });

    //Then delete the session
    await Session.deleteOne({ _id: session._id });
    res.status(200).json({ message: "Session deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
