/**
 * DRAFT — all Georgian copy for Brindo.
 * Needs proofreading by a native Georgian speaker before launch. Do not hard-code
 * Georgian text anywhere else; import it from this file.
 */

export const DRAFT = true;

export const copy = {
  meta: {
    siteName: "Brindo",
    description: "ელეგანტური ციფრული მოსაწვევები ქორწილისთვის. გაუგზავნეთ სტუმრებს ბმული და მიიღეთ პასუხები ერთ ადგილას.",
  },

  ui: {
    loading: "იგზავნება…",
    decrease: "შემცირება",
    increase: "გაზრდა",
  },

  auth: {
    login: {
      title: "შესვლა",
      label: "შესვლა",
      heading: "კეთილი იყოს თქვენი მობრძანება",
      lead: "შეიყვანეთ ელფოსტა და გამოგიგზავნით შესვლის ბმულს. პაროლი არ დაგჭირდებათ.",
      email: "ელფოსტა",
      submit: "ბმულის გამოგზავნა",
    },
    errors: {
      invalidEmail: "გთხოვთ, შეიყვანოთ სწორი ელფოსტის მისამართი",
      rateLimited: "ძალიან ბევრი მცდელობაა. სცადეთ რამდენიმე წუთში.",
      failed: "ბმული ვერ გაიგზავნა. სცადეთ თავიდან.",
      link: "ეს ბმული ვადაგასულია ან უკვე გამოყენებულია. მოითხოვეთ ახალი.",
    },
    sent: {
      label: "ბმული გაიგზავნა",
      heading: "შეამოწმეთ ფოსტა",
      body: "შესვლის ბმული გავაგზავნეთ მისამართზე",
      hint: "ბმული მოქმედებს ერთი საათის განმავლობაში. თუ წერილი არ ჩანს, შეამოწმეთ სპამის საქაღალდე.",
      retry: "სხვა ელფოსტის გამოყენება",
    },
    /** Mirrored by hand in supabase/templates/magic-link.html and supabase/config.toml (subject). */
    email: {
      subject: "თქვენი შესვლის ბმული · Brindo",
      heading: "შესვლის ბმული",
      body: "დააჭირეთ ღილაკს, რომ შეხვიდეთ თქვენს ანგარიშზე. ბმული მოქმედებს ერთი საათის განმავლობაში და მხოლოდ ერთხელ.",
      button: "შესვლა",
      ignore: "თუ ეს თქვენ არ მოგითხოვიათ, უბრალოდ დააიგნორეთ ეს წერილი.",
    },
  },

  /** Placeholder dashboard until the editor stage. */
  dashboard: {
    title: "ჩემი მოსაწვევები",
    label: "კაბინეტი",
    heading: "თქვენი მოსაწვევები",
    empty: "აქ დაიწყება თქვენი დღის ისტორია. შექმენით პირველი მოსაწვევი.",
    create: "მოსაწვევის შექმნა",
    edit: "რედაქტირება",
    preview: "ნახვა",
    guests: "სტუმრები",
    noDate: "თარიღი ჯერ არჩეული არ არის",
    status: { draft: "მონახაზი", paid: "გადახდილი", published: "გამოქვეყნებული" },
    signedInAs: "შესული ხართ როგორც",
    signOut: "გასვლა",
  },

  /** Step one of a new invitation: the names, which also make its link. */
  create: {
    title: "ახალი მოსაწვევი",
    label: "ახალი მოსაწვევი",
    heading: "ვისი ქორწილია?",
    lead: "დავიწყოთ სახელებით. დანარჩენს რედაქტორში შეავსებთ.",
    partnerA: "თქვენი სახელი",
    partnerB: "პარტნიორის სახელი",
    submit: "გაგრძელება",
    back: "ჩემი მოსაწვევები",
    failed: "მოსაწვევი ვერ შეიქმნა. სცადეთ თავიდან.",
  },

  editor: {
    title: "რედაქტორი",
    back: "ჩემი მოსაწვევები",
    sections: {
      names: "სახელები",
      date: "თარიღი და დრო",
      venue: "ადგილი",
      message: "მიმართვა სტუმრებს",
      program: "პროგრამა",
      rsvp: "პასუხის ვადა",
      photo: "ფოტო",
      template: "დიზაინი",
    },
    fields: {
      partnerA: "თქვენი სახელი",
      partnerB: "პარტნიორის სახელი",
      namesHint: "სახელი და გვარი, ან მხოლოდ სახელი",
      date: "თარიღი",
      time: "დრო",
      venueName: "ადგილის სახელი",
      address: "მისამართი",
      city: "ქალაქი",
      mapQuery: "რუკაზე საძიებო ტექსტი",
      mapQueryHint: "არასავალდებულო. ცარიელის შემთხვევაში ვიყენებთ ადგილს, მისამართს და ქალაქს.",
      message: "ტექსტი",
      dressCode: "დრესკოდი",
      optional: "არასავალდებულო",
      rsvpDeadline: "ბოლო ვადა",
      rsvpDeadlineHint: "სტუმრები ამ დღემდე გიპასუხებენ",
      programTime: "დრო",
      programLabel: "რა ხდება",
    },
    program: {
      add: "პუნქტის დამატება",
      remove: "პუნქტის წაშლა",
      empty: "პროგრამა არასავალდებულოა. დაამატეთ, თუ გინდათ სტუმრებმა დღის განრიგი იცოდნენ.",
    },
    photo: {
      choose: "ფოტოს არჩევა",
      replace: "ფოტოს შეცვლა",
      remove: "ფოტოს წაშლა",
      hint: "ერთი ფოტო, ვერტიკალური ან ჰორიზონტალური. ატვირთვამდე შევამცირებთ.",
      preparing: "მზადდება…",
      uploading: "იტვირთება",
      failed: "ფოტო ვერ აიტვირთა. სცადეთ თავიდან.",
      unsupported: "აირჩიეთ JPG, PNG ან WebP ფოტო.",
      focus: "დააჭირეთ ფოტოზე იმ წერტილს, რომელიც ყოველთვის უნდა ჩანდეს.",
      focusLabel: "ფოკუსის წერტილი",
    },
    template: {
      label: "შაბლონი",
      /** Under each template's name in the picker */
      tones: { lumiere: "ნათელი, ჰაეროვანი", noir: "მუქი, საღამოს" },
    },
    tabs: {
      label: "რედაქტორის განყოფილებები",
      details: "დეტალები",
      guests: "სტუმრები",
    },
    guests: {
      add: {
        title: "სტუმრის დამატება",
        name: "სტუმრის სახელი",
        nameHint: "მაგალითად: ნინო ბერიძე, ან ბერიძეების ოჯახი",
        maxPartySize: "რამდენ ადამიანზეა მოსაწვევი",
        submit: "დამატება",
      },
      bulk: {
        toggle: "რამდენიმე სტუმრის ერთად დამატება",
        label: "სახელები, თითო ხაზზე ერთი",
        hint: "ჩასვით სია Viber-იდან ან ცხრილიდან. ცარიელ ხაზებს გამოვტოვებთ.",
        maxPartySize: "თითოეულ მოსაწვევზე",
        /** {n}: number of names in the paste */
        submit: "{n} სტუმრის დამატება",
        cancel: "გაუქმება",
        /** {lines}: line numbers, e.g. "2, 5" */
        invalidLines: "შეასწორეთ ხაზები: {lines}",
        /** {n}: the most names one paste accepts */
        tooMany: "ერთ ჯერზე მაქსიმუმ {n} სახელი",
      },
      list: {
        title: "სტუმრების სია",
        /** {n}: number of guests */
        count: "{n} სტუმარი",
        empty: "სტუმრები ჯერ არ არის. დაამატეთ პირველი ზემოთ.",
        /** {n}: party-size limit of one guest */
        partySize: "{n} სტუმარზე",
        note: "თითოეული ბმული პირადია და მხოლოდ ერთ სტუმარს ეკუთვნის. გთხოვთ, ნუ გადაუგზავნით სხვას.",
        notPublished: "ბმულები ამოქმედდება მოსაწვევის გამოქვეყნების შემდეგ.",
        copyLink: "ბმულის კოპირება",
        copied: "დაკოპირდა",
        copyAll: "ყველა ბმულის კოპირება",
        copiedAll: "ყველა ბმული დაკოპირდა",
        copyFailed: "ვერ დაკოპირდა. სცადეთ თავიდან.",
        edit: "რედაქტირება",
        save: "შენახვა",
        cancel: "გაუქმება",
        delete: "წაშლა",
        confirmDelete: "წავშალოთ სტუმარი? მისი პასუხიც წაიშლება.",
        answers: "პასუხების ნახვა",
      },
      errors: {
        name: "გამოიყენეთ ასოები, ციფრები, ჰარი და მარტივი სასვენი ნიშნები",
        tooLong: "სახელი ძალიან გრძელია",
        required: "შეიყვანეთ სახელი",
        failed: "ვერ შეინახა. სცადეთ თავიდან.",
        /** {n}: people this guest already confirmed */
        belowRsvp: "ამ სტუმარმა უკვე დაადასტურა {n} სტუმარი. რაოდენობა ამაზე ნაკლები ვერ იქნება.",
      },
    },
    save: {
      saving: "ინახება…",
      saved: "შენახულია",
      failed: "ვერ შეინახა. ვცდით თავიდან.",
      invalid: "შეასწორეთ მონიშნული ველები",
    },
    link: "ბმული",
    linkHint: "ბმული სახელებიდან იქმნება და აღარ იცვლება.",
    openPage: "გვერდის გახსნა",
    preview: "გადახედვა",
    closePreview: "დახურვა",
    previewFrame: "მოსაწვევის გადახედვა",
    pay: "გადახდა და გამოქვეყნება",
    /** {price}: e.g. "49 ლარი" */
    payHint: "{price} · ერთჯერადი გადახდა. მოსაწვევი გამოქვეყნდება გადახდისთანავე.",
    payNeedsDetails: "გადახდამდე შეავსეთ ყველა სავალდებულო ველი.",
    published: "გამოქვეყნებულია",
    publishedHint: "მოსაწვევი ბმულით ხელმისაწვდომია. ცვლილებებს სტუმრები მაშინვე დაინახავენ.",
    incomplete: "გადახედვაში ცარიელი ველების ნაცვლად ნიმუშის ტექსტი ჩანს.",
    errors: {
      required: "სავალდებულო ველი",
      tooLong: "ტექსტი ძალიან გრძელია",
      tooManyLines: "ძალიან ბევრი ხაზია",
      name: "გამოიყენეთ მხოლოდ ასოები, ჰარი, დეფისი და აპოსტროფი",
      nameWord: "ერთ-ერთი სიტყვა ძალიან გრძელია",
      date: "არასწორი თარიღი",
      time: "არასწორი დრო",
      deadline: "ვადა უნდა იყოს ქორწილის დღემდე",
      programRow: "შეავსეთ დროც და აღწერაც",
      invalid: "შეამოწმეთ ველი",
    },
    /** Shown in the live preview while a required field is still empty. */
    placeholders: {
      partners: ["სახელი", "სახელი"],
      venueName: "ადგილის სახელი",
      address: "მისამართი",
      city: "ქალაქი",
    },
  },

  /** Pay and publish: the hand-off to the hosted checkout, and the page couples come back to. */
  payment: {
    /** {amount}: the price in lari, e.g. "49" */
    price: "{amount} ლარი",
    redirecting: {
      heading: "გადავდივართ უსაფრთხო გადახდაზე",
      body: "გადახდას ამუშავებს Dodo Payments. ბარათის მონაცემები Brindo-სთან არ ინახება.",
    },
    errors: {
      not_found: "მოსაწვევი ვერ მოიძებნა.",
      already_published: "ეს მოსაწვევი უკვე გამოქვეყნებულია.",
      incomplete: "გადახდამდე შეავსეთ ყველა სავალდებულო ველი.",
      failed: "გადახდის გვერდი ვერ გაიხსნა. სცადეთ თავიდან.",
    },
    done: {
      title: "გადახდა",
      confirming: {
        label: "გადახდა",
        heading: "ვადასტურებთ გადახდას",
        body: "ჩვეულებრივ ეს რამდენიმე წამს გრძელდება. გვერდი თავად განახლდება.",
      },
      slow: {
        heading: "დადასტურებას ცოტა მეტი დრო სჭირდება",
        body: "როგორც კი გადახდა დადასტურდება, მოსაწვევი თავად გამოქვეყნდება. შეგიძლიათ დახუროთ ეს გვერდი და მოგვიანებით დაბრუნდეთ.",
        check: "ხელახლა შემოწმება",
      },
      failed: {
        label: "გადახდა",
        heading: "გადახდა ვერ დადასტურდა",
        body: "მოსაწვევი ჯერ არ გამოქვეყნებულა. სცადეთ თავიდან, შესაძლოა სხვა ბარათით.",
      },
      published: {
        label: "გამოქვეყნებულია",
        heading: "მოსაწვევი მზადაა",
        body: "გაუზიარეთ ბმული სტუმრებს. თუ მათ სიაში დაამატებთ, თითოეული საკუთარ ბმულს მიიღებს, პასუხებს კი ერთ ადგილას ნახავთ.",
        link: "ბმული",
        copy: "ბმულის კოპირება",
        copied: "დაკოპირდა",
        addGuests: "სტუმრების დამატება",
        open: "მოსაწვევის ნახვა",
      },
      backToEditor: "რედაქტორში დაბრუნება",
    },
  },

  /** The couple's read-only overview of who is coming: /dashboard/invitations/[id]/guests */
  guestsOverview: {
    title: "სტუმრები",
    heading: "ვინ მოდის",
    back: "ჩემი მოსაწვევები",
    editList: "სიის რედაქტირება",
    readOnly: "პასუხებს სტუმრები თავად ცვლიან, საკუთარი ბმულით.",
    summary: {
      label: "შეჯამება",
      invited: "მოწვეული",
      confirmed: "მოდის",
      declined: "ვერ მოდის",
      awaiting: "პასუხის მოლოდინში",
      /** {n}: people coming, everyone's party sizes added up (for catering) */
      headcount: "სულ {n} ადამიანი",
    },
    filters: {
      label: "სტუმრების ფილტრი",
      all: "ყველა",
      confirmed: "მოდის",
      declined: "ვერ მოდის",
      awaiting: "მოლოდინში",
    },
    status: {
      confirmed: "მოდის",
      declined: "ვერ მოდის",
      awaiting: "მოლოდინში",
    },
    /** {n}: people a guest confirmed */
    party: "{n} სტუმარი",
    /** {n}: a guest's party-size limit */
    invitedFor: "მოსაწვევი {n} სტუმარზე",
    empty: "სტუმრები ჯერ არ დაგიმატებიათ. დაამატეთ სია და თითოეული სტუმარი პირად ბმულს მიიღებს.",
    addGuests: "სტუმრების დამატება",
    emptyFilter: {
      confirmed: "ჯერ არავის დაუდასტურებია.",
      declined: "უარი ჯერ არავის უთქვამს.",
      awaiting: "ყველამ გიპასუხათ.",
    },
    remind: {
      /** {n}: guests who haven't answered */
      title: "{n} სტუმარი ჯერ არ გიპასუხათ",
      titleOne: "ერთი სტუმარი ჯერ არ გიპასუხათ",
      open: "შეხსენება",
      close: "დახურვა",
      lead: "დააკოპირეთ ტექსტი სტუმრის პირადი ბმულით და ჩასვით Viber-ში. ჩვენ არაფერს ვაგზავნით.",
      messageLabel: "შეხსენების ტექსტი",
      messageHint: "შეგიძლიათ შეცვალოთ. ბმული ტექსტს ბოლოში დაემატება.",
      /** {deadline}: e.g. "15 მაისი 2027" */
      message:
        "გამარჯობა! ჩვენი ქორწილი ახლოვდება და ძალიან გვინდა, რომ ჩვენთან ერთად იყოთ.\nგთხოვთ, გვაცნობოთ, შეძლებთ თუ არა მობრძანებას. პასუხის ვადაა {deadline}.\nპასუხის გაგზავნა თქვენი პირადი ბმულით შეგიძლიათ:",
      messageNoDeadline:
        "გამარჯობა! ჩვენი ქორწილი ახლოვდება და ძალიან გვინდა, რომ ჩვენთან ერთად იყოთ.\nგთხოვთ, გვაცნობოთ, შეძლებთ თუ არა მობრძანებას.\nპასუხის გაგზავნა თქვენი პირადი ბმულით შეგიძლიათ:",
      copy: "კოპირება",
      copied: "დაკოპირდა",
      copyFailed: "ვერ დაკოპირდა. სცადეთ თავიდან.",
      notPublished: "ბმულები ამოქმედდება მოსაწვევის გამოქვეყნების შემდეგ.",
    },
  },

  notFound: {
    title: "გვერდი ვერ მოიძებნა",
    body: "შეამოწმეთ ბმული. თუ ის მოსაწვევიდან გადმოიწერეთ, სთხოვეთ წყვილს ხელახლა გამოგიგზავნონ.",
    home: "მთავარი გვერდი",
  },

  /** The public invitation page and its link preview. */
  publicPage: {
    /** Browser and link-preview title: "{names}: მოწვევა" */
    titleSuffix: "მოწვევა",
    ribbon: "გადახედვა — ჯერ არ არის გამოქვეყნებული",
    ogAlt: "მოსაწვევი",
  },

  /**
   * The string table every invitation template uses. Everything else on an invitation comes
   * from the couple's content. Keep these short: they sit in small labels and buttons.
   */
  invitation: {
    kicker: "ჩვენ ვქორწინდებით",
    ampersand: "&",
    months: [
      "იანვარი",
      "თებერვალი",
      "მარტი",
      "აპრილი",
      "მაისი",
      "ივნისი",
      "ივლისი",
      "აგვისტო",
      "სექტემბერი",
      "ოქტომბერი",
      "ნოემბერი",
      "დეკემბერი",
    ],
    /** Sunday first, matching Date.getUTCDay() */
    weekdays: ["კვირა", "ორშაბათი", "სამშაბათი", "ოთხშაბათი", "ხუთშაბათი", "პარასკევი", "შაბათი"],
    date: {
      label: "თარიღი",
      countdownLabel: "დარჩენილია",
      units: ["დღე", "საათი", "წუთი", "წამი"],
      addToCalendar: "კალენდარში დამატება",
      /** Calendar entry title, followed by the couple's names */
      calendarTitle: "ქორწილი",
    },
    venue: {
      label: "ადგილი",
      googleMaps: "Google Maps",
      appleMaps: "Apple Maps",
      dressCode: "დრესკოდი",
    },
    program: {
      label: "პროგრამა",
      title: "დღის განრიგი",
    },
    photoAlt: "წყვილის ფოტო",
    rsvp: {
      label: "დასწრება",
      title: "მობრძანდებით?",
      personal: "პირადი მოსაწვევი",
      deadline: "პასუხის ვადა",
      yes: "მოვალ",
      yesHint: "სიამოვნებით",
      no: "ვერ მოვალ",
      noHint: "სამწუხაროდ",
      partySize: "სტუმრების რაოდენობა",
      partySizeHint: "თქვენი ჩათვლით",
      submit: "პასუხის გაგზავნა",
      noGuest: "პასუხის გასაგზავნად გახსენით თქვენთვის გამოგზავნილი პირადი ბმული.",
      /** Under the guest's name on a personal link. */
      greeting: "თქვენთან ერთად ეს დღე უფრო ნათელი იქნება.",
      /** {n}: the guest's party-size limit */
      invitedFor: "მოსაწვევი {n} სტუმარზეა",
      invitedForOne: "მოსაწვევი ერთ სტუმარზეა",
      /** {n}: confirmed party size, after "მოვალ ·" */
      partyCount: "{n} სტუმარი",
      yourAnswer: "თქვენი პასუხი",
      change: "პასუხის შეცვლა",
      changeHint: "პასუხის შეცვლა ვადის ბოლომდე შეგიძლიათ.",
      thanksNo: "მადლობა, რომ შეგვატყობინეთ. მოგვენატრებით.",
      thanksYes: "გელოდებით!",
      closed: "პასუხების მიღება დასრულდა.",
      closedHint: "თუ რამე შეიცვალა, დაუკავშირდით წყვილს პირადად.",
      errors: {
        network: "კავშირი ვერ დამყარდა. შეამოწმეთ ინტერნეტი და სცადეთ თავიდან.",
        rateLimited: "ძალიან ბევრი მცდელობაა. სცადეთ რამდენიმე წუთში.",
        notFound: "ეს ბმული აღარ მოქმედებს. სთხოვეთ წყვილს ახალი ბმული.",
        closed: "პასუხის ვადა ამოიწურა. თუ რამე შეიცვალა, დაუკავშირდით წყვილს პირადად.",
        /** {n}: the guest's party-size limit */
        partySize: "აირჩიეთ სტუმრების რაოდენობა 1-დან {n}-მდე.",
        failed: "პასუხი ვერ გაიგზავნა. გთხოვთ, სცადოთ თავიდან.",
      },
      /** The Toast: shown after a guest confirms attendance. */
      toast: {
        line: "გელოდებით!",
        sub: "ერთად ავწიოთ სადღეგრძელო.",
        done: "კარგი",
      },
    },
    footer: {
      madeWith: "შექმნილია",
    },
  },

  /** Sample invitations for /preview. Shaped like InvitationContentInput and parsed by the schema. */
  samples: {
    full: {
      partners: ["ალექსანდრე ჯავახიშვილი", "ელისაბედ ციციშვილი-ბაგრატიონი"],
      startsAt: "2027-06-12T17:00",
      venue: {
        name: "ორბელიანების სასახლე",
        address:
          "ილია ჭავჭავაძის გამზირი 37ა\nმეორე სართული, დიდი საბანკეტო დარბაზი\nშესასვლელი ეზოდან, ავტოსადგომი შენობის უკან",
        city: "თბილისი",
        mapQuery: "Ilia Chavchavadze Avenue 37, Tbilisi",
      },
      message:
        "ძვირფასო ოჯახო და მეგობრებო,\nდიდი ხნის ლოდინის შემდეგ ჩვენ ვქორწინდებით და ეს დღე თქვენ გარეშე ვერ წარმოგვიდგენია.\nგვინდა, რომ ჩვენი ცხოვრების ყველაზე ნათელ საღამოს ჩვენთან ერთად იყოთ, ერთად ვიცინოთ, ვიცეკვოთ და ავწიოთ სადღეგრძელო ახალი დასაწყისისთვის.\nგელოდებით დიდი სიყვარულით.",
      photo: {
        url: "/preview/lumiere-sample.jpg",
        blurDataUrl:
          "data:image/webp;base64,UklGRkQAAABXRUJQVlA4IDgAAADQAQCdASoKAAgAAoBCJQBOgBuIprDYAAD+Zn80smYWh4KAWH6JWgweYdcKsn/+w+uWIoaoxEAAAA==",
      },
      program: [
        { time: "17:00", label: "ჯვრისწერა სამების საკათედრო ტაძარში" },
        { time: "18:30", label: "სტუმრების შეხვედრა და აპერიტივი ბაღში" },
        { time: "19:30", label: "საზეიმო ვახშამი" },
        { time: "21:00", label: "პირველი ცეკვა" },
        { time: "23:00", label: "ტორტი და ფეიერვერკი" },
      ],
      rsvpDeadline: "2027-05-15",
      dressCode: "საღამოს სამოსი",
    },
    short: {
      partners: ["ია", "ლუკა"],
      startsAt: "2027-09-04T19:00",
      venue: { name: "ბაღი", address: "ჭავჭავაძის ქუჩა 5", city: "თელავი" },
      message: "გელოდებით.",
      rsvpDeadline: "2027-08-20",
    },
    guest: { name: "ნინო ბერიძე-ჩიქოვანი", maxPartySize: 3 },
    /** The guest overview preview: [name, party-size limit, answer (people coming, 0 = declined, null = no answer)] */
    guestList: [
      ["ნინო ბერიძე-ჩიქოვანი", 3, 3],
      ["გიორგი და მარიამ კაპანაძეები", 2, 2],
      ["ბერიძეების ოჯახი", 6, 5],
      ["ლევან ჯანელიძე", 1, null],
      ["თამარ წერეთელი", 2, 0],
      ["ალექსანდრე ქართველიშვილი-ბაგრატიონი", 4, null],
      ["ანა ლომიძე", 2, 1],
      ["დავით გოგოლაძე", 2, null],
      ["ქეთევან მაისურაძე", 1, 0],
      ["ილია და ნატო ხარაბაძეები", 2, 2],
    ],
  },

  /** Sample content used by /styleguide to test the font and layout with real Georgian text. */
  styleguide: {
    namesShort: ["ნინო", "გიორგი"],
    namesLong: ["ალექსანდრე", "ელისაბედ"],
    namesInline: "ნინო და გიორგი",
    ampersand: "&",
    weekday: "შაბათი",
    month: "ივნისი",
    day: "14",
    year: "2026",
    time: "18:00",
    countdownUnits: ["დღე", "საათი", "წუთი", "წამი"],
    venueName: "მთაწმინდის ბაღი",
    address: "თბილისი, ილია ჭავჭავაძის გამზირი 37, მეორე სართული, დიდი დარბაზი",
    message:
      "ძვირფასო მეგობრებო,\nგვიხარია, რომ ჩვენი ცხოვრების ყველაზე მნიშვნელოვან დღეს ჩვენთან ერთად იქნებით.\nთქვენი სიყვარული და მხარდაჭერა ჩვენთვის ყველაფერს ნიშნავს. მოდით, ერთად ავწიოთ სადღეგრძელო.",
    labels: {
      invitation: "მოსაწვევი",
      date: "თარიღი",
      venue: "ადგილი",
      program: "პროგრამა",
      rsvp: "დასწრება",
    },
    headings: {
      h2: "გელოდებით ჩვენს დღესასწაულზე",
      h3: "ცერემონია და ვახშამი",
    },
    buttons: {
      accept: "სიამოვნებით მოვალ",
      decline: "სამწუხაროდ, ვერ მოვალ",
      calendar: "კალენდარში დამატება",
      maps: "რუკაზე ნახვა",
    },
    fields: {
      name: "სახელი და გვარი",
      nameValue: "ნინო ბერიძე-ჩიქოვანი",
      nameError: "გთხოვთ, მიუთითოთ სახელი",
      message: "მისალოცი სიტყვა",
      messageHint: "არასავალდებულო",
      partySize: "სტუმრების რაოდენობა",
    },
    halo: "სინათლე ჩვენი მთავარი მასალაა",
  },
} as const;

export type Copy = typeof copy;
