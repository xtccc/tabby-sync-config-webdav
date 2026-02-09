package main

import (
	"encoding/json"
	"fmt"
	"os"
	"strings"

	"github.com/spf13/cobra"
	"github.com/starxg/terminus-sync-config/sync-tool/pkg/webdav"
)

var (
	serverURL string
	username  string
	password  string
	directory string
)

func main() {
	rootCmd := &cobra.Command{
		Use:   "sync-tool",
		Short: "Tabby configuration sync tool",
		Long:  `A CLI tool to sync Tabby terminal configuration to WebDAV servers`,
	}

	rootCmd.PersistentFlags().StringVarP(&serverURL, "url", "u", "", "WebDAV server URL")
	rootCmd.PersistentFlags().StringVarP(&username, "username", "U", "", "WebDAV username")
	rootCmd.PersistentFlags().StringVarP(&password, "password", "p", "", "WebDAV password")
	rootCmd.PersistentFlags().StringVarP(&directory, "dir", "d", "", "Directory name on WebDAV")

	// Get command
	getCmd := &cobra.Command{
		Use:   "get",
		Short: "Get files from WebDAV",
		RunE: func(cmd *cobra.Command, args []string) error {
			return runGet()
		},
	}

	// Sync command
	syncCmd := &cobra.Command{
		Use:   "sync",
		Short: "Sync files to WebDAV",
		RunE: func(cmd *cobra.Command, args []string) error {
			return runSync()
		},
	}

	// Delete command
	deleteCmd := &cobra.Command{
		Use:   "delete",
		Short: "Delete directory from WebDAV",
		RunE: func(cmd *cobra.Command, args []string) error {
			return runDelete()
		},
	}

	rootCmd.AddCommand(getCmd, syncCmd, deleteCmd)

	if err := rootCmd.Execute(); err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}
}

func runGet() error {
	if err := validateCredentials(); err != nil {
		return err
	}

	client := webdav.NewClient(serverURL, username, password)
	files, err := client.Get(directory)
	if err != nil {
		return err
	}

	// Output as JSON
	output := map[string]interface{}{
		"success": true,
		"files":   files,
	}

	encoder := json.NewEncoder(os.Stdout)
	encoder.SetIndent("", "  ")
	return encoder.Encode(output)
}

func runSync() error {
	if err := validateCredentials(); err != nil {
		return err
	}

	// Read files from stdin as JSON array
	var files []webdav.File
	decoder := json.NewDecoder(os.Stdin)
	if err := decoder.Decode(&files); err != nil {
		return fmt.Errorf("failed to parse input: %w", err)
	}

	client := webdav.NewClient(serverURL, username, password)
	resultDir, err := client.Sync(directory, files)
	if err != nil {
		return err
	}

	// Output result
	output := map[string]interface{}{
		"success":   true,
		"directory": resultDir,
	}

	encoder := json.NewEncoder(os.Stdout)
	encoder.SetIndent("", "  ")
	return encoder.Encode(output)
}

func runDelete() error {
	if err := validateCredentials(); err != nil {
		return err
	}

	if directory == "" {
		return fmt.Errorf("directory name is required")
	}

	client := webdav.NewClient(serverURL, username, password)
	if err := client.Delete(directory); err != nil {
		return err
	}

	output := map[string]interface{}{
		"success": true,
	}

	encoder := json.NewEncoder(os.Stdout)
	encoder.SetIndent("", "  ")
	return encoder.Encode(output)
}

func validateCredentials() error {
	if serverURL == "" {
		return fmt.Errorf("server URL is required")
	}
	if username == "" || password == "" {
		return fmt.Errorf("username and password are required")
	}
	return nil
}

// Helper functions for parsing token (username:password)
func parseToken(token string) (string, string) {
	parts := strings.SplitN(token, ":", 2)
	if len(parts) == 2 {
		return parts[0], parts[1]
	}
	return token, ""
}
