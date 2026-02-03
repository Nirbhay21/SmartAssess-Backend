ALTER TABLE "auth"."account" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "auth"."session" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "auth"."user" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "auth"."verification" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "Users can update their own accounts" ON "auth"."account" AS PERMISSIVE FOR UPDATE TO "app_user" USING ((user_id = current_setting('app.current_user_id'::text, true)));--> statement-breakpoint
CREATE POLICY "System can insert all accounts" ON "auth"."account" AS PERMISSIVE FOR INSERT TO "app_user" WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "System can see all accounts" ON "auth"."account" AS PERMISSIVE FOR SELECT TO "app_user" USING (true);--> statement-breakpoint
CREATE POLICY "Users can delete their own accounts" ON "auth"."account" AS PERMISSIVE FOR DELETE TO "app_user" USING ((user_id = current_setting('app.current_user_id'::text, true)));--> statement-breakpoint
CREATE POLICY "System can see all sessions" ON "auth"."session" AS PERMISSIVE FOR SELECT TO "app_user" USING (true);--> statement-breakpoint
CREATE POLICY "Users can delete their own sessions" ON "auth"."session" AS PERMISSIVE FOR DELETE TO "app_user" USING ((user_id = current_setting('app.current_user_id'::text, true)));--> statement-breakpoint
CREATE POLICY "Users can update their own sessions" ON "auth"."session" AS PERMISSIVE FOR UPDATE TO "app_user" USING ((user_id = current_setting('app.current_user_id'::text, true)));--> statement-breakpoint
CREATE POLICY "System can create sessions during signup" ON "auth"."session" AS PERMISSIVE FOR INSERT TO "app_user" WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "System can see all users" ON "auth"."user" AS PERMISSIVE FOR SELECT TO "app_user" USING (true);--> statement-breakpoint
CREATE POLICY "System can insert new users" ON "auth"."user" AS PERMISSIVE FOR INSERT TO "app_user" WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "Users can delete their own profile" ON "auth"."user" AS PERMISSIVE FOR DELETE TO "app_user" USING ((id = current_setting('app.current_user_id'::text, true)));--> statement-breakpoint
CREATE POLICY "Users can update their own profile" ON "auth"."user" AS PERMISSIVE FOR UPDATE TO "app_user" USING ((id = current_setting('app.current_user_id'::text, true))) WITH CHECK ((id = current_setting('app.current_user_id'::text, true)));--> statement-breakpoint
CREATE POLICY "App user can manage verification tokens" ON "auth"."verification" AS PERMISSIVE FOR ALL TO "app_user" USING (true) WITH CHECK (true);