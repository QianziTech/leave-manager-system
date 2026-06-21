/**
 * 中英文映射常量
 * 用于各模块统一展示中文标签
 */

/** 用户角色中文映射 */
export const roleLabels: Record<string, string> = {
  employee: '员工',
  supervisor: '主管',
  dept_head: '部门经理',
  admin: '管理员',
}

/** 假期类型中文映射 */
export const leaveTypeLabels: Record<string, string> = {
  sick: '病假',
  personal: '事假',
  annual: '年假',
  other: '其他',
}

/** 假期状态中文映射 */
export const leaveStatusLabels: Record<string, string> = {
  pending: '待审批',
  approved: '已通过',
  rejected: '已拒绝',
  withdrawn: '已撤回',
}

/** 审批决策中文映射 */
export const decisionLabels: Record<string, string> = {
  approved: '通过',
  rejected: '拒绝',
}

/** 审批级别中文映射 */
export const approvalLevelLabels: Record<string, string> = {
  1: '一级审批（主管）',
  2: '二级审批（部门经理）',
}

/** 用户状态中文映射 */
export const userStatusLabels: Record<string, string> = {
  active: '在职',
  inactive: '离职',
}

/** 状态流转日志中文映射 */
export const statusLogLabels: Record<string, string> = {
  submitted: '提交请假',
  level1_approved: '一级审批通过（主管）',
  level1_rejected: '一级审批拒绝（主管）',
  level2_approved: '二级审批通过（部门经理）',
  level2_rejected: '二级审批拒绝（部门经理）',
  final_approved: '请假已通过',
  final_rejected: '请假已拒绝',
  withdrawn: '撤回请假',
  edited: '修改请假内容',
}

/** 状态日志颜色映射 */
export const statusLogColors: Record<string, string> = {
  submitted: 'blue',
  level1_approved: 'green',
  level1_rejected: 'red',
  level2_approved: 'green',
  level2_rejected: 'red',
  final_approved: 'green',
  final_rejected: 'red',
  withdrawn: 'gray',
  edited: 'orange',
}