Feature: Coupling up
  As a player on the island
  I want to couple up with an islander once we are compatible enough
  So that I can progress the relationship storyline

  Background:
    Given an islander named "Priya" with bio "Loves late-night bonfire chats"
    And a player named "Sam"

  Scenario: Coupling up succeeds once compatibility passes the threshold
    Given "Sam"'s compatibility with "Priya" is already 60
    When "Sam" tries to couple up with "Priya"
    Then the coupling should succeed
    And "Sam" and "Priya" should be coupled up

  Scenario: Coupling up fails when compatibility is too low
    Given "Sam"'s compatibility with "Priya" is already 20
    When "Sam" tries to couple up with "Priya"
    Then the coupling should fail with error "Compatibility too low to couple up"
