// groupData.js

export const validGroupData = {
    group_id: 1,  // Changed from groupId to group_id
    name: 'Group A',
    group_type: 'Study Group',  // Changed from groupType to group_type
  };
  
  export const invalidGroupData = {
    group_id: null,
    name: '',
    group_type: '',
  };
  
  export const allGroups = [
    { group_id: 1, name: 'Group A', group_type: 'Study Group' },
    { group_id: 2, name: 'Group B', group_type: 'Learning Group' },
  ];
  