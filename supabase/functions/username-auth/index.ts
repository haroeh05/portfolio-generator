import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, x-client-info, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function respond(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return respond({ error: "Method not allowed." }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    console.error("Missing required Supabase function environment variables.");
    return respond({ error: "Authentication service is not configured." }, 500);
  }

  try {
    const body = await request.json();
    const action = body?.action;
    const username = typeof body?.username === "string"
      ? body.username.trim().toLowerCase()
      : "";
    const password = typeof body?.password === "string" ? body.password : "";
    const email = typeof body?.email === "string" ? body.email.trim() : "";

    if (!["signup", "signin"].includes(action)) {
      return respond({ error: "Choose sign up or sign in." }, 400);
    }
    if (!/^[a-z0-9_]{3,24}$/.test(username)) {
      return respond({ error: "Username must be 3–24 characters and use only letters, numbers, or underscores." }, 400);
    }
    if (password.length < 8 || password.length > 128) {
      return respond({ error: "Password must be between 8 and 128 characters." }, 400);
    }
    if (action === "signup" && (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
      return respond({ error: "Enter a valid email address." }, 400);
    }

    const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const authClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const recoverExistingAccount = async () => {
      const { data: existingAccount, error: existingAccountError } =
        await authClient.auth.signInWithPassword({ email, password });

      if (existingAccountError || !existingAccount.session) {
        return respond({
          error: "This email is already registered. Check its password or sign in with the username linked to that account.",
        }, 409);
      }

      const existingAccountEmail = existingAccount.user.email;
      if (!existingAccountEmail) {
        console.error("Existing account has no email address.");
        return respond({ error: "We couldn’t restore this account’s username. Please contact the site owner." }, 500);
      }

      const metadataUsername = typeof existingAccount.user.user_metadata?.username === "string"
        ? existingAccount.user.user_metadata.username.trim().toLowerCase()
        : "";
      const usernameToRestore = /^[a-z0-9_]{3,24}$/.test(metadataUsername)
        ? metadataUsername
        : username;
      const { data: restoredUsernameEmail, error: restoreLookupError } =
        await serviceClient.rpc(
          "lookup_account_email_for_username",
          { p_username: usernameToRestore },
        );

      if (restoreLookupError) {
        console.error("Could not check existing account username:", restoreLookupError.message);
        return respond({ error: "We couldn’t restore this account’s username. Please try again in a moment." }, 500);
      }

      if (restoredUsernameEmail && restoredUsernameEmail.toLowerCase() !== existingAccountEmail.toLowerCase()) {
        return respond({
          error: "This account’s username is already linked to another account. Please contact the site owner for help.",
        }, 409);
      }

      if (!restoredUsernameEmail) {
        const { error: restoreError } = await serviceClient.rpc(
          "register_username_for_account",
          {
            p_username: usernameToRestore,
            p_email: existingAccountEmail,
            p_user_id: existingAccount.user.id,
          },
        );

        if (restoreError) {
          console.error("Could not restore account username:", restoreError.message);
          return respond({
            error: "We couldn’t restore this account’s username. Please contact the site owner for help.",
          }, 500);
        }
      }

      return respond({ session: existingAccount.session });
    };

    if (action === "signin") {
      const { data: accountEmail, error: lookupError } = await serviceClient.rpc(
        "lookup_account_email_for_username",
        { p_username: username },
      );

      if (lookupError) {
        console.error("Username lookup failed:", lookupError.message);
        return respond({ error: "We couldn’t sign you in right now. Please try again in a moment." }, 500);
      }
      if (!accountEmail) {
        return respond({ error: "No account exists with that username. Check the username or create an account." }, 404);
      }

      const { data, error: signInError } = await authClient.auth.signInWithPassword({
        email: accountEmail,
        password,
      });
      if (signInError || !data.session) {
        return respond({ error: "Invalid username or password. Please check your details and try again." }, 401);
      }

      return respond({ session: data.session });
    }

    let userId: string;
    let createdUser = false;
    const authorization = request.headers.get("Authorization") || "";
    const bearerToken = authorization.replace(/^Bearer\s+/i, "");

    if (
      bearerToken &&
      bearerToken !== anonKey &&
      !bearerToken.startsWith("sb_publishable_")
    ) {
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authorization } },
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data: { user }, error: userError } = await userClient.auth.getUser();

      if (userError) {
        return respond({ error: "Your sign-in expired. Please sign in again." }, 401);
      }

      if (user?.is_anonymous) {
        const { data, error: updateError } = await userClient.auth.updateUser({
          email,
          password,
          data: { username },
        });
        if (updateError) {
          console.error("Could not upgrade anonymous account:", updateError.message);
          return respond({ error: "We couldn’t create your account with those details. Check the email and try again." }, 400);
        }
        userId = data.user.id;
      } else {
        userId = "";
      }
    } else {
      userId = "";
    }

    if (!userId) {
      const { data: registeredUsernameEmail, error: usernameLookupError } =
        await serviceClient.rpc(
          "lookup_account_email_for_username",
          { p_username: username },
        );

      if (usernameLookupError) {
        console.error("Username lookup failed during registration:", usernameLookupError.message);
        return respond({ error: "We couldn’t create your account right now. Please try again in a moment." }, 500);
      }
      if (registeredUsernameEmail) {
        return respond({
          error: registeredUsernameEmail.toLowerCase() === email.toLowerCase()
            ? "This username and email are already registered. Sign in with your username instead."
            : "That username is already in use. Choose a different username.",
        }, 409);
      }

      const { data, error: createError } = await authClient.auth.signUp({
        email,
        password,
        options: { data: { username } },
      });
      if (createError || !data.user) {
        const duplicateEmail = createError?.code === "user_already_exists" ||
          createError?.message.toLowerCase().includes("already registered") ||
          createError?.message.toLowerCase().includes("already exists");
        if (duplicateEmail) {
          return await recoverExistingAccount();
        }
        console.error("Could not create auth user:", createError?.message ?? "No user returned.");
        return respond({ error: "We couldn’t create your account. Check your details and try again." }, 400);
      }

      if (!data.session) {
        if (data.user.identities?.length === 0) {
          return await recoverExistingAccount();
        }

        if (data.user.identities?.length) {
          const { error: cleanupError } = await serviceClient.auth.admin.deleteUser(data.user.id);
          if (cleanupError) {
            console.error("Could not clean up unconfirmed auth user:", cleanupError.message);
          }
        }
        return respond({
          error: "We couldn’t finish creating your account. Please try again later.",
        }, 400);
      }

      userId = data.user.id;
      createdUser = true;
    }

    const { error: registerError } = await serviceClient.rpc(
      "register_username_for_account",
      { p_username: username, p_email: email, p_user_id: userId },
    );

    if (registerError) {
      if (createdUser) {
        const { error: cleanupError } = await serviceClient.auth.admin.deleteUser(userId);
        if (cleanupError) {
          console.error("Could not clean up unregistered auth user:", cleanupError.message);
        }
      }
      console.error("Could not register username:", registerError.message);
      return respond({
        error: "That username or email is already registered. Try signing in or choose different details.",
      }, 400);
    }

    const { data: signInData, error: signInError } = await authClient.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError || !signInData.session) {
      return respond({ error: "Your account was created, but we couldn’t sign you in. Please sign in." }, 500);
    }

    return respond({ session: signInData.session });
  } catch (error) {
    console.error("Username authentication failed:", error);
    return respond({ error: "Something went wrong. Please try again in a moment." }, 500);
  }
});
