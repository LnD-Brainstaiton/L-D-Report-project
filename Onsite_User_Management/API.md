1 - API: GET /lms/users 

Purpose: Fetch all users/employees from the LMS to maintain the complete employee directory. 

 

Implementation via Moodle Web Service: core_user_get_users 

 

REQUEST (REST) 

POST https://lms.elearning23.com/webservice/rest/server.php 

 

Required Query Parameters 

wstoken=YOURTOKEN 

wsfunction=core_user_get_users 

moodlewsrestformat=json 

 

Request Parameters (array of objects) 

criteria[n][key]:   string   // allowed: id, lastname, firstname, idnumber, username, email, auth 

criteria[n][value]: string 

 

Rules 

- Values cannot be empty. 

- Each key may appear only once. 

- AND logic is applied between criteria. 

- Invalid keys are ignored. 

 

Example GET Request 

https://lms.elearning23.com/webservice/rest/server.php 

  ?wstoken=YOURTOKEN 

  &wsfunction=core_user_get_users 

  &moodlewsrestformat=json 

  &criteria[0][key]=email 

  &criteria[0][value]=john@example.com 

 

SUCCESS RESPONSE (TYPED JSON STRUCTURE) 

{ 

  "users": [ 

    { 

      "id":                     int, 

      "username":               string, 

      "firstname":              string, 

      "lastname":               string, 

      "fullname":               string, 

      "email":                  string, 

      "address":                string, 

      "phone1":                 string, 

      "phone2":                 string, 

      "department":             string, 

      "institution":            string, 

      "idnumber":               string, 

      "interests":              string, 

      "firstaccess":            int, 

      "lastaccess":             int, 

      "auth":                   string, 

      "suspended":              int, 

      "confirmed":              int, 

      "lang":                   string, 

      "calendartype":           string, 

      "theme":                  string, 

      "timezone":               string, 

      "mailformat":             int, 

      "trackforums":            int, 

      "description":            string, 

      "descriptionformat":      int, 

      "city":                   string, 

      "country":                string, 

      "profileimageurlsmall":   string, 

      "profileimageurl":        string, 

      "customfields": [ 

        { 

          "type":        string, 

          "value":       string, 

          "displayvalue":string, 

          "name":        string, 

          "shortname":   string 

        } 

      ], 

      "preferences": [ 

        { 

          "name":  string, 

          "value": string 

        } 

      ] 

    } 

  ], 

  "warnings": [ 

    { 

      "item":        string, 

      "itemid":      int, 

      "warningcode": string, 

      "message":     string 

    } 

  ] 

} 

 

ERROR RESPONSE (XML) 

<?xml version="1.0" encoding="UTF-8"?> 

<EXCEPTION class="invalid_parameter_exception"> 

  <MESSAGE>Invalid parameter value detected</MESSAGE> 

  <DEBUGINFO></DEBUGINFO> 

</EXCEPTION> 

 

2 - API: GET /lms/user/{user_id} 

Purpose: Retrieve a specific employee’s full LMS profile for detailed syncing. 

 

Implementation via Moodle Web Service: core_user_get_users_by_field 

 

REQUEST (REST) 

POST https://lms.elearning23.com/webservice/rest/server.php 

 

Required Query Parameters 

wstoken=YOURTOKEN 

wsfunction=core_user_get_users_by_field 

moodlewsrestformat=json 

 

Request Parameters 

field:  string   // allowed: id, idnumber, username, email 

values[n]: string   // values to match 

 

Example GET Request 

https://lms.elearning23.com/webservice/rest/server.php 

  ?wstoken=YOURTOKEN 

  &wsfunction=core_user_get_users_by_field 

  &moodlewsrestformat=json 

  &field=id 

  &values[0]=25 

 

SUCCESS RESPONSE (TYPED JSON STRUCTURE) 

{ 

  [ 

    { 

      "id":                     int, 

      "username":               string, 

      "firstname":              string, 

      "lastname":               string, 

      "fullname":               string, 

      "email":                  string, 

      "address":                string, 

      "phone1":                 string, 

      "phone2":                 string, 

      "department":             string, 

      "institution":            string, 

      "idnumber":               string, 

      "interests":              string, 

      "firstaccess":            int, 

      "lastaccess":             int, 

      "auth":                   string, 

      "suspended":              int, 

      "confirmed":              int, 

      "lang":                   string, 

      "calendartype":           string, 

      "theme":                  string, 

      "timezone":               string, 

      "mailformat":             int, 

      "trackforums":            int, 

      "description":            string, 

      "descriptionformat":      int, 

      "city":                   string, 

      "country":                string, 

      "profileimageurlsmall":   string, 

      "profileimageurl":        string, 

      "customfields": [ 

        { 

          "type":        string, 

          "value":       string, 

          "displayvalue":string, 

          "name":        string, 

          "shortname":   string 

        } 

      ], 

      "preferences": [ 

        { 

          "name":  string, 

          "value": string 

        } 

      ] 

    } 

  ] 

} 

 

ERROR RESPONSE (XML) 

<?xml version="1.0" encoding="UTF-8"?> 

<EXCEPTION class="invalid_parameter_exception"> 

  <MESSAGE>Invalid parameter value detected</MESSAGE> 

  <DEBUGINFO></DEBUGINFO> 

</EXCEPTION> 

 

3 - API: GET /lms/courses 

Purpose: Fetch the full list of online courses for displaying course catalog and history. 

 

Implementation via Moodle Web Service: core_course_get_courses 

 

REQUEST (REST) 

POST https://lms.elearning23.com/webservice/rest/server.php 

 

Required Query Parameters 

wstoken=YOURTOKEN 

wsfunction=core_course_get_courses 

moodlewsrestformat=json 

 

Request Parameters 

options[ids][n] = int   // optional; if empty returns all courses except front page 

 

Example GET Request 

https://lms.elearning23.com/webservice/rest/server.php 

  ?wstoken=YOURTOKEN 

  &wsfunction=core_course_get_courses 

  &moodlewsrestformat=json 

  &options[ids][0]=5 

 

SUCCESS RESPONSE (TYPED JSON STRUCTURE) 

{ 

  [ 

    { 

      "id":                       int, 

      "shortname":                string, 

      "categoryid":               int, 

      "categorysortorder":        int, 

      "fullname":                 string, 

      "displayname":              string, 

      "idnumber":                 string, 

      "summary":                  string, 

      "summaryformat":            int, 

      "format":                   string, 

      "showgrades":               int, 

      "newsitems":                int, 

      "startdate":                int, 

      "enddate":                  int, 

      "numsections":              int, 

      "maxbytes":                 int, 

      "showreports":              int, 

      "visible":                  int, 

      "hiddensections":           int, 

      "groupmode":                int, 

      "groupmodeforce":           int, 

      "defaultgroupingid":        int, 

      "timecreated":              int, 

      "timemodified":             int, 

      "enablecompletion":         int, 

      "completionnotify":         int, 

      "lang":                     string, 

      "forcetheme":               string, 

      "courseformatoptions": [ 

        { 

          "name":   string, 

          "value":  string 

        } 

      ], 

      "showactivitydates":        int, 

      "showcompletionconditions": int, 

      "customfields": [ 

        { 

          "name":       string, 

          "shortname":  string, 

          "type":       string, 

          "valueraw":   string, 

          "value":      string 

        } 

      ] 

    } 

  ] 

} 

 

ERROR RESPONSE (XML) 

<?xml version="1.0" encoding="UTF-8"?> 

<EXCEPTION class="invalid_parameter_exception"> 

  <MESSAGE>Invalid parameter value detected</MESSAGE> 

  <DEBUGINFO></DEBUGINFO> 

</EXCEPTION> 

 

4 - API: GET /lms/courses (Filtered By Field) 

Purpose: Get courses matching a specific field for refined catalog display and syncing. 

 

Implementation via Moodle Web Service: core_course_get_courses_by_field 

 

REQUEST (REST) 

POST https://lms.elearning23.com/webservice/rest/server.php 

 

Required Query Parameters 

wstoken=YOURTOKEN 

wsfunction=core_course_get_courses_by_field 

moodlewsrestformat=json 

 

Request Parameters 

field = string   // allowed: id, ids, shortname, idnumber, category, sectionid 

value = string   // value to match 

 

Example GET Request 

https://lms.elearning23.com/webservice/rest/server.php 

  ?wstoken=YOURTOKEN 

  &wsfunction=core_course_get_courses_by_field 

  &moodlewsrestformat=json 

  &field=shortname 

  &value=Math101 

 

SUCCESS RESPONSE (TYPED JSON STRUCTURE) 

{ 

  "courses": [ 

    { 

      "id":                     int, 

      "fullname":               string, 

      "displayname":            string, 

      "shortname":              string, 

      "courseimage":            string, 

      "categoryid":             int, 

      "categoryname":           string, 

      "sortorder":              int, 

      "summary":                string, 

      "summaryformat":          int, 

      "summaryfiles": [ 

        { 

          "filename":        string, 

          "filepath":        string, 

          "filesize":        int, 

          "fileurl":         string, 

          "timemodified":    int, 

          "mimetype":        string, 

          "isexternalfile":  int, 

          "repositorytype":  string, 

          "icon":            string 

        } 

      ], 

      "overviewfiles": [ 

        { 

          "filename":        string, 

          "filepath":        string, 

          "filesize":        int, 

          "fileurl":         string, 

          "timemodified":    int, 

          "mimetype":        string, 

          "isexternalfile":  int, 

          "repositorytype":  string, 

          "icon":            string 

        } 

      ], 

      "showactivitydates":        int, 

      "showcompletionconditions": int, 

      "contacts": [ 

        { 

          "id":        int, 

          "fullname":  string 

        } 

      ], 

      "enrollmentmethods": [ 

        string 

      ], 

      "customfields": [ 

        { 

          "name":       string, 

          "shortname":  string, 

          "type":       string, 

          "valueraw":   string, 

          "value":      string 

        } 

      ], 

      "idnumber":                string, 

      "format":                  string, 

      "showgrades":              int, 

      "newsitems":               int, 

      "startdate":               int, 

      "enddate":                 int, 

      "maxbytes":                int, 

      "showreports":             int, 

      "visible":                 int, 

      "groupmode":               int, 

      "groupmodeforce":          int, 

      "defaultgroupingid":       int, 

      "enablecompletion":        int, 

      "completionnotify":        int, 

      "lang":                    string, 

      "theme":                   string, 

      "marker":                  int, 

      "legacyfiles":             int, 

      "calendartype":            string, 

      "timecreated":             int, 

      "timemodified":            int, 

      "requested":               int, 

      "cacherev":                int, 

      "filters": [ 

        { 

          "filter":          string, 

          "localstate":      int, 

          "inheritedstate":  int 

        } 

      ], 

      "courseformatoptions": [ 

        { 

          "name":   string, 

          "value":  string 

        } 

      ], 

      "communicationroomname": string, 

      "communicationroomurl":  string 

    } 

  ], 

  "warnings": [ 

    { 

      "item":        string, 

      "itemid":      int, 

      "warningcode": string, 

      "message":     string 

    } 

  ] 

} 

 

ERROR RESPONSE (XML) 

<?xml version="1.0" encoding="UTF-8"?> 

<EXCEPTION class="invalid_parameter_exception"> 

  <MESSAGE>Invalid parameter value detected</MESSAGE> 

  <DEBUGINFO></DEBUGINFO> 

</EXCEPTION> 

 

5 - API: GET /lms/course/{course_id}/enrollments 

Purpose: Fetch all employees enrolled in a specific online course, including completion status and activity. 

 

Implementation via Moodle Web Service: core_enrol_get_enrolled_users 

 

REQUEST (REST) 

POST https://lms.elearning23.com/webservice/rest/server.php 

 

Required Query Parameters 

wstoken=YOURTOKEN 

wsfunction=core_enrol_get_enrolled_users 

moodlewsrestformat=json 

 

Request Parameters 

courseid = int   // required 

 

Optional Parameters (options[]) 

* withcapability (string) 

* groupid (int) 

* onlyactive (int) 

* onlysuspended (int) 

* userfields (string list) 

* limitfrom (int) 

* limitnumber (int) 

* sortby (string) 

* sortdirection (string) 

 

Example GET Request 

https://lms.elearning23.com/webservice/rest/server.php 

  ?wstoken=YOURTOKEN 

  &wsfunction=core_enrol_get_enrolled_users 

  &moodlewsrestformat=json 

  &courseid=12 

 

SUCCESS RESPONSE (TYPED JSON STRUCTURE) 

{ 

  [ 

    { 

      "id":                   int, 

      "username":             string, 

      "firstname":            string, 

      "lastname":             string, 

      "fullname":             string, 

      "email":                string, 

      "address":              string, 

      "phone1":               string, 

      "phone2":               string, 

      "department":           string, 

      "institution":          string, 

      "idnumber":             string, 

      "interests":            string, 

      "firstaccess":          int, 

      "lastaccess":           int, 

      "lastcourseaccess":     int, 

      "description":          string, 

      "descriptionformat":    int, 

      "city":                 string, 

      "country":              string, 

      "profileimageurlsmall": string, 

      "profileimageurl":      string, 

      "customfields": [ 

        { 

          "type":      string, 

          "value":     string, 

          "name":      string, 

          "shortname": string 

        } 

      ], 

      "groups": [ 

        { 

          "id":                int, 

          "name":              string, 

          "description":       string, 

          "descriptionformat": int 

        } 

      ], 

      "roles": [ 

        { 

          "roleid":    int, 

          "name":      string, 

          "shortname": string, 

          "sortorder": int 

        } 

      ], 

      "preferences": [ 

        { 

          "name":  string, 

          "value": string 

        } 

      ], 

      "enrolledcourses": [ 

        { 

          "id":        int, 

          "fullname":  string, 

          "shortname": string 

        } 

      ] 

    } 

  ] 

} 

 

ERROR RESPONSE (XML) 

<?xml version="1.0" encoding="UTF-8"?> 

<EXCEPTION class="invalid_parameter_exception"> 

  <MESSAGE>Invalid parameter value detected</MESSAGE> 

  <DEBUGINFO></DEBUGINFO> 

</EXCEPTION> 

 

6 - API: GET /lms/user/{user_id}/courses 

Purpose: Fetch the complete online course history for a specific employee. 

 

Implementation via Moodle Web Service: core_enrol_get_users_courses 

 

REQUEST (REST) 

POST https://lms.elearning23.com/webservice/rest/server.php 

 

Required Query Parameters 

wstoken=YOURTOKEN 

wsfunction=core_enrol_get_users_courses 

moodlewsrestformat=json 

 

Request Parameters 

userid = int   // required user ID 

returnusercount = int (default=1)   // include enrolled user count 

 

Example GET Request 

https://lms.elearning23.com/webservice/rest/server.php 

  ?wstoken=YOURTOKEN 

  &wsfunction=core_enrol_get_users_courses 

  &moodlewsrestformat=json 

  &userid=25 

  &returnusercount=0 

 

SUCCESS RESPONSE (TYPED JSON STRUCTURE) 

{ 

  [ 

    { 

      "id":                       int, 

      "shortname":                string, 

      "fullname":                 string, 

      "displayname":              string, 

      "enrolledusercount":        int, 

      "idnumber":                 string, 

      "visible":                  int, 

      "summary":                  string, 

      "summaryformat":            int, 

      "format":                   string, 

      "courseimage":              string, 

      "showgrades":               int, 

      "lang":                     string, 

      "enablecompletion":         int, 

      "completionhascriteria":    int, 

      "completionusertracked":    int, 

      "category":                 int, 

      "progress":                 double, 

      "completed":                int, 

      "startdate":                int, 

      "enddate":                  int, 

      "marker":                   int, 

      "lastaccess":               int, 

      "isfavourite":              int, 

      "hidden":                   int, 

      "overviewfiles": [ 

        { 

          "filename":        string, 

          "filepath":        string, 

          "filesize":        int, 

          "fileurl":         string, 

          "timemodified":    int, 

          "mimetype":        string, 

          "isexternalfile":  int, 

          "repositorytype":  string, 

          "icon":            string 

        } 

      ], 

      "showactivitydates":        int, 

      "showcompletionconditions": int, 

      "timemodified":            int 

    } 

  ] 

} 

 

ERROR RESPONSE (XML) 

<?xml version="1.0" encoding="UTF-8"?> 

<EXCEPTION class="invalid_parameter_exception"> 

  <MESSAGE>Invalid parameter value detected</MESSAGE> 

  <DEBUGINFO></DEBUGINFO> 

</EXCEPTION> 

 

7 - API: GET /lms/progress/{course_id}/{user_id} 

Purpose: Fetch module-level progress (percentage, hours studied, last access) for detailed reporting. 

 

Implementation via Moodle Web Service: core_completion_get_course_completion_status 

 

REQUEST (REST) 

POST https://lms.elearning23.com/webservice/rest/server.php 

 

Required Query Parameters 

wstoken=YOURTOKEN 

wsfunction=core_completion_get_course_completion_status 

moodlewsrestformat=json 

 

Request Parameters 

courseid = int   // required 

userid = int     // required 

 

Example GET Request 

https://lms.elearning23.com/webservice/rest/server.php 

  ?wstoken=YOURTOKEN 

  &wsfunction=core_completion_get_course_completion_status 

  &moodlewsrestformat=json 

  &courseid=10 

  &userid=25 

 

SUCCESS RESPONSE (TYPED JSON STRUCTURE) 

{ 

  "completionstatus": { 

    "completed":        int, 

    "aggregation":      int, 

    "completions": [ 

      { 

        "type":           int, 

        "title":          string, 

        "status":         string, 

        "complete":       int, 

        "timecompleted":  int, 

        "details": { 

          "type":         string, 

          "criteria":     string, 

          "requirement":  string, 

          "status":       string 

        } 

      } 

    ] 

  }, 

  "warnings": [ 

    { 

      "item":        string, 

      "itemid":      int, 

      "warningcode": string, 

      "message":     string 

    } 

  ] 

} 

 

ERROR RESPONSE (XML) 

<?xml version="1.0" encoding="UTF-8"?> 

<EXCEPTION class="invalid_parameter_exception"> 

  <MESSAGE>Invalid parameter value detected</MESSAGE> 

  <DEBUGINFO></DEBUGINFO> 

</EXCEPTION> 

 

 

8 - API: GET /lms/users?updated_since={timestamp} 

Purpose: Fetch only employees who were updated recently. 

 

Implementation via Moodle Web Service: core_user_get_users 

 

REQUEST (REST) 

POST https://lms.elearning23.com/webservice/rest/server.php 

 

Required Query Parameters 

wstoken=YOURTOKEN 

wsfunction=core_user_get_users 

moodlewsrestformat=json 

 

Required Search Criteria 

criteria[0][key]=email 

criteria[0][value]=% 

 

Filtering Logic (Performed on Your Backend) 

updated_since = UNIX timestamp (int) 

Include only users where: 

- user.lastaccess >= updated_since 

- OR user.timemodified >= updated_since (if available) 

 

Example GET Request 

https://lms.elearning23.com/webservice/rest/server.php 

  ?wstoken=YOURTOKEN 

  &wsfunction=core_user_get_users 

  &moodlewsrestformat=json 

  &criteria[0][key]=email 

  &criteria[0][value]=% 

 

SUCCESS RESPONSE (TYPED JSON STRUCTURE) 

{ 

  "users": [ 

    { 

      "id":                     int, 

      "username":               string, 

      "firstname":              string, 

      "lastname":               string, 

      "fullname":               string, 

      "email":                  string, 

      "address":                string, 

      "phone1":                 string, 

      "phone2":                 string, 

      "department":             string, 

      "institution":            string, 

      "idnumber":               string, 

      "interests":              string, 

      "firstaccess":            int, 

      "lastaccess":             int, 

      "auth":                   string, 

      "suspended":              int, 

      "confirmed":              int, 

      "lang":                   string, 

      "calendartype":           string, 

      "theme":                  string, 

      "timezone":               string, 

      "mailformat":             int, 

      "trackforums":            int, 

      "description":            string, 

      "descriptionformat":      int, 

      "city":                   string, 

      "country":                string, 

      "profileimageurlsmall":   string, 

      "profileimageurl":        string, 

      "customfields": [ 

        { 

          "type":        string, 

          "value":       string, 

          "displayvalue":string, 

          "name":        string, 

          "shortname":   string 

        } 

      ], 

      "preferences": [ 

        { 

          "name":  string, 

          "value": string 

        } 

      ] 

    } 

  ], 

  "warnings": [ 

    { 

      "item":        string, 

      "itemid":      int, 

      "warningcode": string, 

      "message":     string 

    } 

  ] 

} 

 

ERROR RESPONSE (XML) 

<?xml version="1.0" encoding="UTF-8"?> 

<EXCEPTION class="invalid_parameter_exception"> 

  <MESSAGE>Invalid parameter value detected</MESSAGE> 

  <DEBUGINFO></DEBUGINFO> 

</EXCEPTION> 

 

API: GET /lms/courses?updated_since={timestamp} 

Purpose: Fetch only newly added or modified online courses. 

 

Moodle Web Service Used 

core_course_get_courses 

 

NOTE: Moodle does NOT provide an 'updated_since' filter. 

To implement this endpoint, your backend must: 

- Call core_course_get_courses (which returns all courses except front page). 

- Filter the returned courses using the 'timemodified' field. 

 

REQUEST (REST) 

POST https://lms.elearning23.com/webservice/rest/server.php 

 

Required Query Parameters 

wstoken=YOURTOKEN 

wsfunction=core_course_get_courses 

moodlewsrestformat=json 

 

Optional Parameters (Moodle supported) 

options[ids][0] = int   // Fetch specific course IDs 

 

Updated Since Filter (Handled by YOUR backend) 

updated_since = UNIX timestamp (int) 

Filter condition: 

course.timemodified >= updated_since 

 

Example GET Request 

https://lms.elearning23.com/webservice/rest/server.php 

  ?wstoken=YOURTOKEN 

  &wsfunction=core_course_get_courses 

  &moodlewsrestformat=json 

 

SUCCESS RESPONSE (TYPED JSON STRUCTURE) 

{ 

  "courses": [ 

    { 

      "id":                 int, 

      "shortname":          string, 

      "fullname":           string, 

      "displayname":        string, 

      "categoryid":         int, 

      "format":             string, 

      "summary":            string, 

      "summaryformat":      int, 

      "idnumber":           string, 

      "startdate":          int, 

      "enddate":            int, 

      "timecreated":        int, 

      "timemodified":       int, 

      "visible":            int, 

      "showgrades":         int, 

      "courseimage":        string 

    } 

  ], 

  "synced_after": timestamp 

} 

 

ERROR RESPONSE (XML) 

<?xml version="1.0" encoding="UTF-8"?> 

<EXCEPTION class="invalid_parameter_exception"> 

  <MESSAGE>Invalid parameter value detected</MESSAGE> 

  <DEBUGINFO></DEBUGINFO> 

</EXCEPTION> 

 

10 - API: GET /lms/enrollments?updated_since={timestamp} 

Purpose: Fetch only new or updated online course enrollments. 

 

IMPORTANT NOTE 

Moodle DOES NOT provide any built‑in API to filter enrollments by updated_since. 

This endpoint MUST be implemented by your backend using existing Moodle web services. 

 

Moodle Web Service Used 

core_enrol_get_enrolled_users  // returns enrollments per course 

 

IMPLEMENTATION LOGIC (Correct & Moodle‑Compliant) 

1. Call core_course_get_courses to fetch all course IDs. 

2. For each course, call core_enrol_get_enrolled_users?courseid={id}. 

3. From each enrollment record, use fields: 

   - timecreated 

   - timemodified 

4. Backend filters: 

   if enrollment.timecreated >= updated_since OR 

      enrollment.timemodified >= updated_since: 

         include in results 

 

REQUEST (REST) 

POST https://lms.elearning23.com/webservice/rest/server.php 

 

Required Query Parameters 

wstoken=YOURTOKEN 

wsfunction=core_enrol_get_enrolled_users   // called per course 

moodlewsrestformat=json 

 

Updated Since (Backend Filtering Only) 

updated_since = UNIX timestamp (int) 

 

Example Internal Requests 

https://lms.elearning23.com/webservice/rest/server.php 

  ?wstoken=YOURTOKEN 

  &wsfunction=core_enrol_get_enrolled_users 

  &moodlewsrestformat=json 

  &courseid=14 

 

SUCCESS RESPONSE (TYPED JSON STRUCTURE) 

{ 

  "enrollments": [ 

    { 

      "userid":        int, 

      "courseid":      int, 

      "status":        int, 

      "timestart":     int, 

      "timeend":       int, 

      "timecreated":   int,  // use for updated_since filtering 

      "timemodified":  int   // use for updated_since filtering 

    } 

  ], 

  "synced_after": timestamp 

} 

 

ERROR RESPONSE (XML) 

<?xml version="1.0" encoding="UTF-8"?> 

<EXCEPTION class="invalid_parameter_exception"> 

  <MESSAGE>Invalid parameter value detected</MESSAGE> 

  <DEBUGINFO></DEBUGINFO> 

</EXCEPTION> 

 